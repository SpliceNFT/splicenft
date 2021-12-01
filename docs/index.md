# Splice creates generative art for the NFT metaverse
 
NFTs make great profile pictures. Showing off your NFT as a profile picture, preferably on the collection communities' Discord channels, makes you part of the gang! Large communities grow around NFT collections and invent derivative value - like [elementary pet companions](https://mobile.twitter.com/coolcatsnft/status/1459302026077110274) for cool cats, [derivative works](https://opensea.io/collection/mutant-ape-yacht-club) on BAYC or [Doge puppies](https://opensea.io/collection/doge-pound-puppies-real).

These derivative elements can form a metaverse where NFT communities flourish – a world of playspaces, workplaces, games, tools, accessories, weapons, etc. So that's a great vision, but currently there aren't good tools to make it happen.

That's where Splice comes in.

Splice ties together **building blocks for metaverse creation**. When you input your NFT, Splice extracts its features and metadata and generates a data array that's fed into generative code elements which renders a derivative NFT. The most obvious and immediate usecase: **header images** for places like Twitter and Discord where the NFT community currently meets. Anyone who owns an NFT can create a matching header image on Splice.

## How it works

First, you choose an NFT item that you own. In theory that can be anything but PFP collections like Cool Cats, Doodles or Bored Apes work best. Next, Splice extracts the dominant colors of the token's palette and computes an entropy base for random number generators out of the origin collection's contract address and the input token's id. 

The actual code that's rendering the Splice results - we're referring to it as "style" - is permanently persisted on IPFS and wrapped in another NFT of a dedicated **splice style contract**. Since [Splice styles are NFTs](https://testnets.opensea.io/collection/splice-style-nft-v2), they can be traded, staked or sold on secondary markets. The minter of a style (usually the artist who wrote its code) defines its minting price behaviour, collection constraints and minting cap. Fees accrued during the minting process are distributed to the current style owner.

![extract](img/extract.png)

We're handing over the entropy and the palette of your origin NFT to the code behind your selected style NFT. Your browser downloads its code, applies the derived input data and renders the resulting Splice image. If you like the result, you can make it unique and mint it. 

To recreate the artwork for a minted Splice token, one simply extracts the origin information and the chosen style id, downloads the style NFT code from IPFS and recreates the rendering in another browser window. 

![extract](img/sample.png)

Splices are immutable by design. They only depend on input image data, a code base that's stored on an unique, tamper-proof and unstoppable storage layer ([IPFS](https://ipfs.io/)) and deterministically computable input parameters. Hence, as long as the original images don't change, your Splice will always be programmatically recoverable.

## Our Vision

Minting header images is just how Splice gets started. Under the hood it can do much more than that. We actually have prepared our contracts to accept more than one origin NFT, so generative artists could write code that combines two (or more) NFT seeds to breed something completely new. 

And it's not restricted to PFP collections. Artists could use the Splice protocol to combine a Decentraland estate, a Cool Cat and a Loot token to create a dedicated artwork, a background story or a new character of a cat adventure game. Building this kind of game mechanics usually requires a lot of individual coding but Splice lowers the entry barrier by controlling all proofs of ownership and gives artists a clear idea how to write code that responds to an NFT's origin traits and attributes.