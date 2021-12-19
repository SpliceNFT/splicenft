# Splice for Developers
 
## Project Setup / Tech Stack

We have structured the Splice codebase as [monorepo](https://semaphoreci.com/blog/what-is-monorepo) that can be easily built using [pnpm](https://pnpm.io/). Most packages require some environment variables to be set, so make sure to scan all `README`s and `.env.sample` files in the repo. To run all Splice services and Dapps on your own box, you'll certainly need API keys from [Etherscan](https://etherscan.io/register), [NFTPort](https://www.nftport.xyz/sign-up), [nft.storage](https://nft.storage/#getting-started) and [Infura](https://infura.io/). Once you've got your env vars in place, you should be able to simply run 

```
pnpm install
pnpm -r build
```
to build all packages in the correct order. The most relevant dependency graph is `dapp|backend <- common <- contracts`. The language of choice for all code is Typescript. 

## Contracts

Our smart contracts are written in [Solidity 0.8.10](https://docs.soliditylang.org/en/v0.8.10/) and make heavy use of [OpenZeppelin's base contracts](https://docs.openzeppelin.com/contracts/4.x/). To compile / deploy them on your local machine you can use the local `hardhat` binary that's part of the package's dependencies. Have a look at the package's README file to get an idea of how to get started and make sure to have a good understanding on [Hardhat's tooling](https://hardhat.org/getting-started/).

### Randomness

Each style relies on a certain **randomness** that makes its results unique. We're precomputing this entropy seed out of deterministic inputs a minter provides: the origin collection's address and the chosen origin token id. This is the secret formula in pseudocode:

```
randomSeed = uint32(keccak256(abi.encode([origin_address],[origin_token_id])))
```

Since most Javascript libraries can only deal with 32 bits of numeric precision we're stripping the least significant 32 bits of the 256 bit long keccak hash. In theory that might lead to collisions but we consider that neglectible because the randomness is only one factor that determines the Splice result.

### Provenance

The Splice contract has been written with gas efficiency in mind, hence we kept all bookkeeping structures to an absolute minimum. Foremost, Splice is intentionally **not** inheriting OpenZeppelin's Enumerable base which saves us a lot of gas. Additionally, we're not mapping plain origins to token ids directly, but rather use a *provenance* hash that allows the contract to figure out if a combination of inputs has been minted before. The provenance hash is computed as

```solidity
bytes32 _provenanceHash = keccak256(
  abi.encodePacked(origin_collections, origin_token_ids, style_token_id)
);
```

Since the explicit provenances aren't part of the contract's state and Splice owners aren't iterable, a developer who wants to list all available Splices and their origins needs to scan the contract for `Mint` and `Transfer` events:

=== "Contract"

    ```solidity
    emit Minted(
      keccak256(abi.encode(origin_collections, origin_token_ids)),
      token_id,
      style_token_id
    );
    ```

=== "find a splice for an origin"

    ```typescript title="Splice.ts"
    public async findProvenances(
      collectionAddress: string,
      tokenId: string
    ): Promise<TokenProvenance[]> {
      const originHash = Splice.originHash(collectionAddress, tokenId);

      const filter = this.contract.filters.Minted(originHash);
      const mintedEvents = await this.contract.queryFilter(
        filter,
        this.deployedAtBlock
      );

      if (mintedEvents.length === 0) return [];
      return mintedEvents.map((ev) => {
        const { style_token_id, token_id: style_token_token_id } =
          Splice.tokenIdToStyleAndToken(ev.args.token_id);
        return {
          origin_collection: collectionAddress,
          origin_token_id: ethers.BigNumber.from(tokenId),
          splice_token_id: ev.args.token_id,
          style_token_id,
          style_token_token_id
        };
      });
    }
    ```
=== "find the origin for a Splice"

    ```typescript title="Splice.ts"
      public async getProvenance(
      spliceTokenId: BigNumber
      ): Promise<TokenProvenance | null> {
        const bnTokenId: BigNumber =
          'string' === typeof spliceTokenId
            ? BigNumber.from(spliceTokenId)
            : spliceTokenId;

        const filter = this.contract.filters.Minted(null, spliceTokenId);
        const mintedEvents = await this.contract.queryFilter(
          filter,
          this.deployedAtBlock
        );
        if (mintedEvents.length == 0) return null;

        if (mintedEvents.length > 1)
          throw new Error('a token can only be minted once');

        const mintEvent = mintedEvents[0];
        const tx = await mintEvent.getTransaction();
        const inputData = this.contract.interface.decodeFunctionData(
          this.contract.interface.functions[
            'mint(address[],uint256[],uint32,bytes32[],bytes)'
          ],
          tx.data
        );

        const { style_token_id, token_id: style_token_token_id } =
          Splice.tokenIdToStyleAndToken(spliceTokenId);

        return {
          origin_collection: inputData.origin_collections[0],
          origin_token_id: inputData.origin_token_ids[0],
          splice_token_id: bnTokenId,
          style_token_id,
          style_token_token_id
        };
      }
    ```


This obviously will become very expensive in terms of RPC requests and latency so we've created a [Subgraph](https://thegraph.com/hosted-service/subgraph/elmariachi111/splicemultirinkeby) that does all this heavylifting for you. Find out more about subgraph usage in the [Subgraph section](#subgraphs).

### Token IDs

You might've wondered why Splice's token ids seem to be so "big" and unpredictable (e.g. `4294967298`). Truth is: that's only because you're looking at them from a human perspective :). Like many other generative art collections we've decided to make the unique token id a combination of style id and an incremental token number. In Splice's case we're thinking big and use the full range of uint32 for both components. 

Hence, a token id is represented as an `Uint64` value with its higher significant 32 bits being the style token id (e.g. `0x00000001`) and the lower 32 bits representing the incremental part. The above mentioned token id is actually the decimal representation of the hexadecimal number (padded to 64 bits) `0x0000000100000002`

```js
ethers.utils.zeroPad(ethers.BigNumber.from("4294967298").toHexString(), 8)
// Uint8Array(8) [
//  0, 0, 0, 1,
//  0, 0, 0, 2
// ]
```

## Style Features

### Collection constraints

The owner of a style token may choose to restrict minting of their style to certain origin collections using the style contract's `restrictToCollections` method. That feature particularly makes sense when the artist had a certain collection in mind when creating their style. 

### Allowlists

We've added an allowlist feature to our style contract that makes it possible for an artist (or whoever mints an artist's style) to reserve mints for friends, family or a community. That way an artist can set a low cap for a style (like cap of 500), but still be sure certain collectors get access to mint before her collection's sold out.

Instead of going with a plain allowlist array we decided to make use of [Merkle tree proofs](https://docs.openzeppelin.com/contracts/4.x/api/utils#MerkleProof). We haven't implemented a nice snapshotting / tree creation tool as of now, but you can checkout the `contracts` packages' `allowlist.test.ts` tests to see how it's supposed to work. 

## Dynamic Pricing

The first styles we're launching will require a static minting fee that's set by the style minter role who mints the style NFT on behalf of an artist. We plan to implement more sophisticated approaches to pricing of mints, including Dutch auctions, bonding curves or even oracle based price indicators based on a collection's current floor price. 

To be flexible in terms of mint price indication we've decoupled price computations from the main contracts: upon minting the style minter decides which pricing strategy should be in effect for the new style. Each strategy is implemented as a dedicated smart contract that must implement the `ISplicePriceStrategy` interface to return a price denoted in wei: 

```solidity
interface ISplicePriceStrategy {
  function quote(
    SpliceStyleNFT styleNFT,
    IERC721 collection,
    uint256 token_id,
    StyleSettings memory styleSettings
  ) external view returns (uint256);
}
```

Since each implementation will receive the full `styleSettings` struct of the requesting style, it can determine a price point unique for each style. That struct's `priceParameters` field may contain implementation specific information, e.g. a minimum and a maximum price. So far we only implemented a static pricing strategy that simply returns the `priceParameters` content, which effectively becomes a fixed price parameter.

## Subgraphs

We've built the splice contract as gas efficient as possible, reducing bookkeeping on chain to a minimum: each splice NFT contains a hash to quickly prove its origins and the style token id that had been chosen for minting. As mentioned in the [Provenance](#provenance) section, the `subgraph` package contains a subgraph definition that's deployed on [The Graph protocol's hosted service](https://thegraph.com/hosted-service/). It reads all `Mint` and `Transfer` events, extracts the minting parameters by using the transaction inputs, and provides a GraphQL API to query certain aspects of the Splice contracts' current state. Here's an example of how to get all splices of an user:

=== "GQL Query"

    ```graphql
    query SplicesOfOwner($owner: String) {
        spliceice(where: { owner: $owner }) {
          id
          metadata_url
          style {
            id
            metadata_url
          }
          origin_collection
          origin_token_id
          origin_metadata_url
        }
      }
    ```

=== "Result"

    ```json
    {
      "data": {
        "spliceice": [
          {
            "id": "4294967298",
            "metadata_url": "https://validate.getsplice.io/splice/4/4294967298",
            "origin_collection": "0xf5aa8981e44a0f218b260c99f9c89ff7c833d36e",
            "origin_metadata_url": "https://api.coolcatsnft.com/cat/26",
            "origin_token_id": "26",
            "style": {
              "id": "1",
              "metadata_url": "ipfs://bafyreiedlvkrjowkrs6u74ogyritsfaitsanhujzbciyaoedg33fndbxuu/metadata.json"
            }
          },
          ...
        ]
      }
    }
    ```

## Common package

The `common` package contains code that's shared between our Dapp and the backend. Most importantly we make sure  serverside and frontend renderers use *exactly* the same code so as not to confuse users with varying visual results. 

If you look at the `extractPalette` export from `img.ts` you'll notice that the code to compute an image's predominant colors is used on the frontend (`dapp/src/components/organisms/CreativePanel:extractPixels`) and on the backend (`backend/src/lib/Origin.ts`). 

Other exports that are exposed by the `common` package are

- `Splice.ts`: a contract class that wraps a [typechain](https://opensourcelibs.com/lib/typechain)-typed instance of an ethers based Splice contract interface and adds some convenience methods to interact with it. 

- `Style.ts`: manages a style's code and wraps it into an executable JS function

- `types/NFTs`: contains type definitions for NFT metadata and secondary services.

- `indexers`: contains code to read existing NFTs from chain and extract their metadata in an abstract way: if you know which collections you'd like to read and you have access to a web3 provider, you can use the `OnChain` indexer. If you need to find all assets owned by an user on mainnet, you can use the `NFTPort` indexer class instead. Our dapp uses the `Fallback` indexer that tries reading from NFTPort and falls back to the on chain implementation if NFTPort hasn't fully indexed the collection yet.

## Backend

The basic Splice concept doesn't depend on a backend at all: since styles and their code are stored on IPFS and one can recover origin minting parameters from the Splice contract, you can rebuild your Splice NFT anytime. (We'll be providing dedicated tools for rebuilding soon). 

Since IPFS lookups and chain queries are usually related to high latencies or aren't free (Infura's free tier is high, but their RPC timeouts are rather low), we're providing a backend service that speeds up many use cases significantly.

Our backend package is a rather plain express server that responds to 5 API endpoints (see `backend/src/server.ts`) and its base URI is `https://validate.getsplice.io`:

- `GET /styles/:network` returns all styles (without code) including their metadata that are deployed on `network` (e.g. `4` for `rinkeby`)
- `GET /render/:network/:style_token_id` renders a grayscale preview of a style.
- `GET /styles/:network/:style_token_id` returns metadata and inline code of a style token
- `GET /splice/:network/:tokenid` returns the metadata for Splice `tokenid`
- `GET /splice/:network/:tokenid/image.png` returns the Splice image for `tokenid` on `network`

What makes the backend so powerful is its caching mechanism: Instead of fetching origins, extracting colors and rerendering NFT metadata on every request, we're caching all results once they have been created for the first time. There's an [open issue](https://github.com/SpliceNFT/splicenft/issues/122) to align the cache layout in a way that's suitable for simple style freezing, too. 

### Dapp

Our dapp is building on a plain and simple [CRA + Typescript](https://create-react-app.dev/docs/adding-typescript/) foundation. We're using [Chakra UI](https://chakra-ui.com/docs/getting-started) for dynamic styling and inject the most important dependencies using a shared context provider (see `dapp/src/context/SpliceContext.tsx`). You can start the CRA dev server as you're used to:

```bash
pnpm run start
```

An important word of notice: since we're trying to adhere to web3 principles as closely as possible, the build output is hosted on a decentralized network. We don't want to bother with IPNS and DNSLink details, and that's why we've decided to hand over the final build and deployment process to the [awesome services of Fleek.co](https://fleek.co)
