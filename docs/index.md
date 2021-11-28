# Splice creates generative art for the NFT metaverse
 
NFTs make great profile pictures. Showing off your NFT as a profile picture, preferably on the collection communities' Discord channels, makes you part of the gang! Large communities grow around NFT collections and invent derivative value - like $MILK tokens and companion eggs for cool cats, spinoffs on BAYC or puppies for Doges.

These derivative elements can form a metaverse where NFT communities flourish – a world of playspaces, workplaces, games, tools, accessories, weapons, etc. So that’s a great vision, but currently there aren’t good tools to make it happen.

That’s where Splice comes in.

Splice generates building blocks for metaverse creation. When you input your NFT, Splice extracts its features and metadata and generates an array of derivative elements. The most obvious and immediate need: header images for places like Twitter and Discord where the NFT community currently meets. Anyone who owns an NFT can create a matching header image on Splice.

## How it works

First, you choose an NFT item that you own. In theory that can be anything but PFP collections like Cool Cats, Doodles, Bored Apes or Heads work best. Next, Splice extracts the most dominant colors of the token's palette and computes an entropy base for random number generators out of the origin collection's contract address and the token's id. 

The code that'll render the Splice results - we're referring to it as "style" - is living on IPFS and backed as another NFT on a dedicated splice style contract. Each style can be restricted by its artist in terms of collections and cap when it's created. 

We're handing over the entropy and the palette of your origin NFT to the style code you've chosen and the splice result is rendered inside your browser window. Now it's up to you to decide whether you want to make that result unique and mint it. We tried to build the splice contract as gas efficient as possible, so we're not storing much on chain: each splice NFT contains a hash to quickly prove its origins and the style token id that had been chosen for minting. 

To recreate the artwork for a splice token, one simply extracts the origin information (which can either be done by checking the mint transaction of that splice or querying our subgraph but Splice's frontend will hide all that heavylifting from you anyway) and the chosen style id, downloads the style nft code from IPFS if necessary and recreates the rendering in another browser window. 

Splices are immutable by design. They only depend on input image data, a code base that's stored on a unique and unchangeable storage layer (IPFS) and deterministically computable input parameters. Hence, as long as the original images don't change, your Splice will always be programmatically recoverable.Most popular collections have usually "frozen" their image date once they minted out or even within the minting phase. 
