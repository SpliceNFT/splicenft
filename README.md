## Splice generates a metaverse for your NFT
 
## The Problem 
NFTs make great profile pictures. Showing off your NFT as a profile picture, preferably on the collection communities' Discord channels, makes you part of the gang! Large communities grow around NFT collections and invent derivative value -- like $MILK tokens and companion eggs for cool cats, spinoffs on BAYC or puppies for Doges. 

These derivative elements can form a metaverse where NFT communities flourish – a world of playspaces, workplaces, games, tools, accessories, weapons, etc. 

So that’s a great vision, but currently there aren’t good tools to make it happen. 

## Our Solution
That’s where Splice comes in. 

Splice generates building blocks for metaverse creation. When you input your NFT profile picture, Splice extracts its features and metadata, and generates a wide array of derivative elements.  

We’re just getting started. For this hackathon, we’ve built an MVP to address an immediate need: header images for places like Twitter and Discord where the NFT community currently lives. Anyone who owns an NFT in a collection we’ve onboarded can now create a matching header image on Splice.

## How It Works
We (as a DAO) are incrementally onboarding select NFT collections to our Splice contract. All pieces of these collections must share a common style but differ e.g. in their color palette and metadata traits. Artists create style algorithms (p5 atm) to generate art based on these input parameters. After our DAO's approval, artists mint their code as style NFTs (code goes to IPFS) and open them for header minting.

When an owner of an NFT first visits our Dapp, we display the NFTs they own, using NFTPort, Covalent and our own chain scanner. They can choose one of their NFTs as a seed, then pick an NFT style from artists who’ve contributed to our site, and request a header image. That officially makes them a “requestor” on our site. 

What happens next? Splice extracts image and metadata from the chosen seed NFT and style NFT, and renders an unexpected artwork using local entropy (a hash of the collection's address & the token id) inside the requestor's browser. If the requestor likes the result, Splice uploads its PNG representation to nft.storage. The requestor can use that image, but doesn’t yet own it, because image and metadata aren't directly verifiable on chain. To officially mint the header image on a Splice contract we need another trust layer.

Upon minting, requestors send minting input to the Splice contract, containing:

- the extracted parameters needed for the render code (palette, metadata traits, stroke width etc.)
- a hash of all the NFT’s metadata and all generative parameters 
- the NFT id for the chosen generative algorithm 
- the IPFS hash of their pre-rendered PNG representation

A (chainlink) oracle independently extracts the same information as the requestor did locally, compares it with what they requested on chain, renders the artwork using the same algorithm and compares the final result to the IPFS hash the user provided. If the oracle comes to the same result as the requestor, it "green lights" the Splice contract. 

Once confirmed, the requestor initiates the final mint. The contract checks whether the mint request is green lit and mints the piece to the requestor.

## What’s Next, Short Term
We're capping the minting of tokens on an input collection basis. You can't mint as many headers as there are tokens in the origin collection. 

Requestors must pay a minting fee that's used to

- pay the oracle fees (LINK)
- pay royalties to the style artist (sent to the current owner of the style NFT)
- give back a share to the origin collection (since we're deriving from their original idea)
- keep a small share to our own DAO

Once the original piece is sold, the contract transfers header ownership too. (If this should happen automatically we need a hook that the originating NFT contracts can call back, adding gas fees to their transfer tx.)

## And Mid Term...
The minting fee can be dynamic, using a bonding curve that takes several aspects into account:

- the current market price of the requestor's NFT (need an oracle that signals the collection's floor price or, even better, a floor for the tier of the origin NFT (some cats are cooler than others) ). This could be achieved by utilizing rarity.tools as one source for oracle data
- the background collection's current supply: later pieces are more expensive
- a fee that's defined by the style artist

If we were to add this, we might define a cap on that fee or (reverse?) auction it proportionally to the time the collection is part of Splice.
