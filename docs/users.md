# User Guide

To give Splice a try, in its current deployment on Rinkeby, you'll need to visit our main page and connect your wallet to a supported network. Proceed to the "[My NFTs](https://getsplice.io/#/my-assets)" page to display the NFTs you own on the connected network, and select one. 

On Rinkeby you can mint some selected testnet NFTs free. Note, that in order to make use of Ethereum testnets you'll need some testnet Ether which you can [get for free by testnet faucets](https://faucet.paradigm.xyz/).

### Selecting or creating origin NFTs

You may discover that on testnets not all of your collected NFTs show up. That's due to limitations of the indexers we're using. At the moment, we're only scanning a select group of collections. This won't be an issue on Mainnet, where we're using [NFTPort](https://www.nftport.xyz/) to discover and display all your assets.

![Displaying all your assets / mint a testnet NFT](img/myassets.png)

### Minting a Splice

Once you've selected an NFT you'd like to splice,  head over to its detail page and wait for the image to load. Depending on the origin's pixel dimensions this can take a little while, because we must load the original artwork (likely to be stored on IPFS) and extract its predominant colors. We're also calculating a seed for the style's random number generator out of the origin collection's address and the origin token's ID.

Once all deterministic parameters have been extracted, you can choose a style for your Splice. We're downloading the chosen style's code from IPFS (in practice we're using a cached version to speed things up), apply the extracted parameters to it, and display the rendered result immediately on that page. 

![minting view](img/mint.png)

If you like the resulting generated artwork, you can mint it as a Splice NFT. Each style may have a different minting cap and pricing strategy, determined by the protocol and the style artist. Our three initial styles use a fixed minting fee.

![confirm the mint](img/confirm_mint.png)

### View your Splices

You can view all of the Splices you own on the "[My Splices](https://getsplice.io/#/my-splices)" page. Alongside each splice, you'll see its style, computed randomness and tokenURI the Splice contract yielded.

![my splices](img/my_splices.png)

You also can view your Splices on marketplace applications, e.g. on OpenSea. Splice derivatives are compatible to the [ERC-721](https://ethereum.org/en/developers/docs/standards/tokens/erc-721/) standard and are therefore tradeable like any other NFT asset.

![Splice on OpenSea](img/opensea.png)

Splice differs from usual NFT "collectibles" as the rarity and scarcity of a style collection can not be predetermined before its minted. Therefore we cannot rely on IPFS to freeze a splice image immediately after minting. Instead, the metadata is hosted / generated on a backend that we're hosting (`https://validate.getsplice.io`). 

But that's not really a "centralized" tradeoff: since all styles, their code base and your origin NFT (hopefully) are stored on IPFS, you can deterministically recreate your Splice using any modern browser at any time. At the time of writing we haven't enabled the fully decentralized rerendering feature on our page but we're planning to offer a dedicated package that'll enable you to easily recreate all artworks at any time without any dependency on any backend service other than IPFS.

## Minting Rules and Provenances

It's possible to mint more than one Splice for a particular seed NFT, but it's not possible to do so using the same style, i.e. the combination of [origin collection - origin token id - style token id] is the **unique key** that identifies a splice - we also refer to this combination as **provenance**.

On the other hand we've prepared the Splice contract to be future ready: technically it's already possible to use **more than one origin NFT** as an input. We haven't written style code and style interfaces that make use of this feature, but that's something our artists will be able to experiment with very soon.

## Interacting with Splice contracts directly

Splice is a public ERC721 contract, so you are encouraged to read its source code or interact with it using your preferred chain explorer or command line tool. We deployed the main Splice contract using OpenZeppelin's [upgradeable base contracts](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable) and verified its sources on Etherscan as Transparent Proxy. 

![Splice on Etherscan](img/etherscan.png)

### Contract addresses

#### Rinkeby

Splice base contract: [0xEa934c468e6c8c0C60E6E62797ae57dBD601970f](https://rinkeby.etherscan.io/address/0xEa934c468e6c8c0C60E6E62797ae57dBD601970f#code)  
Splice Style NFT: [0x25a82392fd023f741900a3953468d08246204d5c](https://rinkeby.etherscan.io/address/0x25a82392fd023f741900a3953468d08246204d5c#code)  
Static Price Strategy: [0x6c429D0801F18849563A235A046882482a739a3f](https://rinkeby.etherscan.io/address/0x6c429D0801F18849563A235A046882482a739a3f#code)  

### Owner

At the moment, the Splice protocol is owned by the platform. The most important right that owner bears is to **pause** the Splice contract, effectively disabling new mints and transfers. This is necessary (and a very common practice) to be able to stop operations and upgrade contracts when attackers abuse flaws they found in our source code. Besides that important technical implication, the contract owner bears two additional rights: she can decide which account receives or loses the *curator* role. The owner of the Splice protocol also decides about the split of minting fees between artists and the platform beneficiary. 

### Curator

An account bearing the curator role may mint new style NFTs at any time. Style minting is a non trivial task, since once minted many characteristics of a style can never be changed again (e.g. the overall cap of a style).

### Artist

A generative artist can choose to become her own curator and mint her style, or assign that task to another curator. Either way, whoever mints the style NFT can define its pricing and cap (max. amount of mints). 

### Style Owner

A collector's minting fee for a Splice that's been generated with the style of her choice will be split between the a platform (15%, see below) and  **current holder** of the style NFT (85%). Since style NFTs are transferrable, that holder is not necessarily the original artist. Artists can sell their style NFTs with a forward looking price tag. 

![tradeable style nfts](img/style_nft.png)

### Platform Beneficiary

Splice takes a 15% share of all minting fees. Instead of simply sending that cut to the owner of all Splice contracts we instead decided to introduce a dedicated *platform beneficiary* role that's allowed to withdraw the platform cut. 

## Withdrawing funds

To transfer minting fees, we're following [well known and recommended best practices](https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls) that makes use of an internal fee escrow that accrues funds on behalf of beneficiaries. Funds may withdraw at any time by calling the `Splice.withdrawShares` method (which requires a small amount of Eth on the caller's side to pay for gas).

## Freezing styles

We have implemented a freeze feature on the style contract that can be called by curators when the cap of a collection has been reached (i.e. it's fully minted). A curator must first create a directory containing all metadata and splice renderings and add (ideally pin) it to IPFS. The resulting directory hash is then used by the Splice contract's `tokenURI` method. Frozen styles cannot be unfrozen, which means all metadata is final and unchangeable.

