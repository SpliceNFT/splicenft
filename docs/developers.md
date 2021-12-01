# Splice for Developers
 
## Project Setup / Tech Stack

We have structured the Splice codebase as monorepo that can be easily built using [pnpm](https://pnpm.io/). For certain packages some `.env` vars are needed, so make sure to scan all `README`s in our repo. To run all Splice services and Dapps on your own box, you'll certainly need API keys from [Etherscan](https://etherscan.io/register), [NFTPort](https://www.nftport.xyz/sign-up), [nft.storage](https://nft.storage/#getting-started) and [Infura](https://infura.io/). Once you've got your env vars in place, you should be able to simply run 

```
pnpm install
pnpm -r build
```
to build all packages in the right order. Generally the most relevant dependency graph is `dapp|backend <- common <- contracts`. The predominant language used is Typescript. 

## Contracts

Our smart contracts are written in Solidity 0.8.10 (the latest version right now) and make heavy use of OpenZeppelin's base contracts. To compile / deploy them on your local machine you can use the local `hardhat` binary that's part of the package's dependencies. Have a look at the package's README file to get an idea of how to get started.

### Randomness

Each style relies on a certain randomness that makes its results unique. We're precomputing this entropy seed out of deterministic inputs a minter provides: the origin collection's address and the chosen origin token id. In detail, this is the secret formula in pseudocode:

```
rndSeed = uint32(keccak256(abi.encode([origin_address],[origin_token_id])))
```

Since most Javascript libraries (p5 is no exception) can only deal with 32 bits of numeric precision we're stripping the least significant 32 bits of the 256 bit long keccak hash. In theory that might lead to collisions but we consider that neglectible because the randomness is only one factor that determines the Splice result.

### Provenance

The Splice contract has been written with gas efficiency in mind, hence we kept all bookkeeping structures to an absolute minimum. Foremost, Splice is intentionally **not** inheriting OpenZeppelin's Enumerable base which saves us a lot of gas. Additionally, we're not mapping plain origins to token ids directly, but rather use a *provenance* hash that allows the contract to figure out if a combination of inputs has been minted before. The provenance hash is computed out as

```solidity
bytes32 _provenanceHash = keccak256(
  abi.encodePacked(origin_collections, origin_token_ids, style_token_id)
);
```

Since the explicit provenances aren't part of the contract's state and Splice owners aren't iterable, a developer who wants to list all available Splices and their origins needs to read the `Mint` and `Transfer` events:

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

You might've wondered why Splice's token ids seem to be so "large" and unpredictable (e.g. `4294967298`). Truth is: they aren't :). Like many other generative art collections we've decided to make the unique token id a combination of style and an incremental token number. In Splice's case we wanted to think big and use a Uint64 value for token ids, with its higher significant 32 bits being the style token id (e.g. `0x00000001`) and the lower 32 bits representing the incremental part. The above token id is actually the decimal representation of the hexadecimal number (padded to 64 bits) `0x0000000100000002`

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

You can't predict success in the NFT space, can you? Before opening up a deployed style to be spliced, it must be marked as "on sale". On the other hand you might feel tempted to restrict its mints to a rather low cap (like 1000) to make it a rare asset. So, what's happening if suddenly half of the NFT space races towards your style upon opening and it's minted out within seconds? That happened before and it will happen again, so we decided to add an allowlist feature to the style contract that makes it possible to reserve mints for the artist's best friends, family or community. Instead of going with a plain allowlist array we decided to make use of Merkle tree proofs. We haven't implemented a nice snapshotting / tree creation tool as of now, but you can checkout the `allowlist.test.ts` tests to see how it's supposed to work. 

## Dynamic Pricing

The first styles we're launching will request a static minting fee that's set by the curator that mints the style NFT. When we started Splice in September 2021 we had far more sophisticated ideas on how to set an ideal price point for mints, including Dutch auctions, bonding curves or even oracle based price indicators based on a collection's current floor price. To be flexible in terms of mint price indication we've decoupled pricing indications from the main contracts: upon minting the curator decides which pricing strategy should be in effect. Each strategy is implemented as a dedicated smart contract that must implement the `ISplicePriceStrategy` interface to return a price denoted in wei: 

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

Since each implementation will receive the full `styleSettings` struct of the requesting style, it can determine a price point unique for each style. That struct's `priceParameters` field may contain implementation specific information, e.g. a minimum and a maximum price. So far we only implemented a static pricing strategy that simply returns the `priceParameters` content which effectively becomes a fixed price parameter.

## Subgraphs

We tried to build the splice contract as gas efficient as possible, so we've reduced the bookkeeping on chain to a minimum: each splice NFT contains a hash to quickly prove its origins and the style token id that had been chosen for minting. As pointed out in the [Provenance](#provenance) section, the `subgraph` package contains a subgraph definition that's deployed on The Graph protocol (hosted service). It reads all `Mint` and `Transfer` events, extracts the minting parameters by using the transaction inputs and provides a GraphQL API to query certain aspects of the Splice contracts' current state. Here's an example to get all splices of an user:

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

the `common` package contains code that's shared between our Dapp and the frontend. Most importantly we must make sure that any server and frontend side rendering use exactly the same code so we're not irritating the user with different results. If you look at the `extractPalette` export from `img.ts` you'll notice that the code that computes an image's most dominant colors is used on the frontend (`dapp/src/components/organisms/CreativePanel:extractPixels`) and on the backend (`backend/src/lib/Origin.ts`). 

Other exports that play a common role are

- `Splice.ts` is a contract class that wraps a typechain-typed instance of an ethers based Splice contract interface and adds some convenience methods to interact with it. 

- `Style.ts` manages a style's code and wraps it into an executable JS function

- `types/NFTs` contains type definitions for NFT metadata and secondary services.

- `indexers` contains code to read existing NFTs from chain and extract their metadata in an abstract way: if you know which collections you'd like to read and have access to a web3 provider, you can use the `OnChain` indexer, if you need to find all assets owned by an user (e.g. on mainnet) you instead can go with the `NFTPort` wrapper. Our dapp uses the `Fallback` indexer that starts reading from NFTPort and falls back to the on chain implementation if NFTPort hasn't indexed the collection correctly yet.

## Backend

The Splice concept doesn't depend on a backend at all: since styles and their code are stored on IPFS and one can recover origin minting parameters from the Splice contract, you can rebuild your Splice NFT at anytime (if you know what you're doing, we're going to provide dedicated tools for this soon). Since IPFS lookups and chain queries are usually having high latencies or aren't free (Infura's free tier is high, but their timeouts are rather low), we're providing a backend service that speeds up many use cases significantly.

Our backend package right now is a rather plain express server that responds to 5 API endpoints (see `backend/src/server.ts`):

- `GET /styles/:network` returns all styles (without code) and their metadata which are deployed on a network (e.g. `4` for `rinkeby`)
- `GET /render/:network/:style_token_id` renders a grayscale preview of a style.
- `GET /styles/:network/:style_token_id` returns metadata and inline code of a style token
- `GET /splice/:network/:tokenid` returns the metadata for Splice `tokenid`
- `GET /splice/:network/:tokenid/image.png` returns the Splice image for `tokenid` on `network`

What makes the backend so powerful is its caching implementation: Instead of fetching origins, extracting colors and rerendering on every request we're caching all results once they have been created for the first time. There's an [open issue](https://github.com/SpliceNFT/splicenft/issues/122) to align the cache layout in a way that it's suitable for simple style freezing. 

### Dapp

Our dapp is building on the plain and simple CRA + Typescript foundation. We're using Chakra UI for dynamic styling and inject the most important dependencies using a shared context provider. You can start the CRA dev server as you're used to:

```bash
pnpm run start
```

An important word of notice: since we're trying to adhere to web3 principles as closely as possible the build's output is hosted on a decentralized network. We don't want to bother with IPNS and DNSLink details and that's why we've decided to hand over the final build and deployment process to the [awesome services of Fleek.co](https://fleek.co)