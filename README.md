## Splice creates generative art for the NFT metaverse
 
NFTs make great profile pictures. Showing off your NFT as a profile picture, preferably on the collection communities' Discord channels, makes you part of the gang! Large communities grow around NFT collections and invent derivative value - like $MILK tokens and companion eggs for cool cats, spinoffs on BAYC or puppies for Doges.

These derivative elements can form a metaverse where NFT communities flourish – a world of playspaces, workplaces, games, tools, accessories, weapons, etc. So that’s a great vision, but currently there aren’t good tools to make it happen.

That’s where Splice comes in.

Splice generates building blocks for metaverse creation. When you input your NFT, Splice extracts its features and metadata and generates an array of derivative elements. For the start at EthOnline we've built an MVP to address an immediate need: header images for places like Twitter and Discord where the NFT community currently lives. Anyone who owns an NFT in a collection that we've onboarded can create a matching header image on Splice.

## How it works

First, we (as a DAO) are onboarding dedicated collections to our Splice contract. All pieces of these collections must share a common style and differ e.g. by their color palette and metadata traits. Artists create style algorithms (p5 right now) to generate art based on these input parameters. After our DAO's approval they mint their code as style NFT (code goes to IPFS) and open it up for header minting.

When owners of collection NFTs - we call them "requestors" - visit our Dapp, it first displays all NFTs they own (we're using NFTPort, Covalent and our own chain scanner for testnets here). They choose one NFT they'd like to get a background image for and choose a render style for it. We're extracting image- and metadata from the chosen piece and render the artwork using deterministic entropy from a hash of the collection's address & the token id inside the requestor's browser. If the requestor is fine with the result, we're uploading its PNG representation to nft.storage, effectively creating preliminary metadata on IPFS, too. The requestor can now already use that image, but isn't owning it yet. Image- and metadata aren't directly verifiable on chain, so to officially mint the header image on the Splice contract we need another trust layer.

Upon a minting request, requestors initiate a "mint job" on the Splice contract. It contains the IPFS hash of the created image and metadata and the randomness they used to create the image. The metadata contains all generative parameters, including primary colors and the selected render algorithm (e.g. ipfs://bafyreifgr4vqnhg67f7gpfwiipe5wmkvschm52vyzpo74ztlau5272tr2e/metadata.json)

An (chainlink) oracle independently extracts the same information as the requestor did locally by calling a server side rendering endpoint that we're hosting on a dedicated machine. This validator node renders the artwork using the same algorithm and generative data as the requestor did, compares the final result to the image the requestor suggested and sends back a "green light" to the Splice contract if the render results match. 

Once confirmed, the requestor may initiate the final mint. The contract checks whether the mint request is green lit and allows minting the generated artwort to the requestor.

### Additional ideas, short term

We're capping the minting of tokens on an input collection basis. You can't mint as many backgrounds as there are tokens in the origin collection. 

Requestors must pay a minting fee that's used to 

- pay the oracle fees (LINK)
- pay royalties to the style artist (sent to the current owner of the style NFT)
- give back a share to the origin collection (since we're deriving from their original idea)
- keep a small share to our own DAO

Once the original piece is sold, the contract transfers the background ownership, too (if this should happen automatically we need some hook that the origin NFT contracts can call back, adding gas fees to their transfer tx)

### mid term
the minting fee can be dynamic, using a bonding curve that takes several aspects into account:

- the current market price of the requestor's NFT (need an oracle that signals the collection's floor price or, even better, a floor for the tier of the origin NFT (some cats are cooler than others) ). This could be achieved by utilizing rarity.tools as one source for oracle data
- the background collection's current supply: later pieces are more expensive
- a fee that's defined by the style artist

If we were to add this, we might define a cap on that fee or (reverse?) auction it proportionally to the time the collection is part of Splice.


# How it's made

This project ist built on Typescript and Solidity (>0.8)

We've made use of

### NFTPort and Covalent 
We're using their APIs to get a list of mainnet (testnet) NFTs of an user. But for our demo, we need indexed assets on kovan,  and wrote our own chain scanning code for that. One idea of Splice is to let users mint NFTs of existing collections which have to be "registered" on our contract so we can distribute minting fee shares - that's why we would need some query that could get all NFTs of an user filtered by a list of collection addresses. 

### ERC721 Test-NFT contracts
To be able to demonstrate the functionality, Splice needs sample collections on the Kovan chain. We've created 2 fake collections representing metadata of Cool Cats and BAYC that everyone is allowed to mint: https://kovan.etherscan.io/token/0x6334d2cbc3294577bb9de58e8b1901d6e3b97681 / https://kovan.etherscan.io/token/0x6d96aAE79399C6f2630d585BBb0FCF31cCa88fa9 

### IPFS & nft.storage
This was the most helpful tool here: we're pushing the rendered artworks as blobs  + some custom metadata to nft.storage and already got a pinned and accessible version ready, great. On first thought we wanted to validate on our (oraclized) backend that the asset CIDs from the frontend match the ones on the backend but it turned out that rendering on the browser and on a server (node-p5) lead to slightly different results. Therefore we're writing plain "string" CIDs for the individual asset metadata into our contract (we have written CIDv0 byte optimized code but that's not compatible to CIDv1 / dag-pb :( )   

### Chainlink
Since Splice doesn't trust the user for minting our generated artwork, we're verifying the metadata and generated image data on the server side. We've created a dedicated contract to interact with Chainlink's HttpGet jobs and even built a clever way to return the token_id and a validness flag (boolean) within one bytes32 response. Unfortunately our backend never got requested by the Kovan Chainlink oracle (even though it got enough LINK) so we had to mock that part for the demo slightly: right now our backend validator is triggered by the user who wants to mint and simply greenlights a mint once it has verified that metadata  and image are correct.

### Rendering
For the rendering we're using p5 inside React & p5-node server side + the usual suspects like expressjs (wanted to use vercel but vercel can't compile everything needed for p5 rendering, so atm the validation code runs on one of our DigitalOcean Droplets), pnpm (best pm in the world) and of course Fleek for totally decentralized IPFS hosting.

We're quite proud to have built a true monorepo that can be built (after setting some env vars) using a pnpm install && pnpm run -r build instruction. Some common code to interact with our contracts is extracted to a dedicated package (@splicenft/common) and it even yields typechain information to the clients. 

