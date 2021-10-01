## Splice creates generative art for NFTs
 
NFTs make great profile pictures, therefore most of them are minted in a square format. Large communities grow around them and invent derivative value: be it $MILK tokens and companion eggs for cool cats, spinoffs on BAYC or puppies for Doges. Showing off your NFT as a profile picture, preferably on the collection communities' Discord channels is the crypto answer to owning a golden watch: you're part of the gang! 

There's one missing piece though: the background image. Sure, you could get some fancy one yourself but what would it feel like if you not only own a piece of a collection but also the perfect, official match of a background image for it to use on Twitter, Linkedin or OpenSea?

**Splice lets you mint that.**

First, we (as a DAO) are onboarding dedicated collections to our Splice contract. All pieces of these collections must share a common style and differ e.g. by their color palette and metadata traits. Artists create style algorithms (p5 atm) to generate art based on these input parameters. After our DAO's approval they mint their code as style NFT (code goes to IPFS) and open it up for header minting.

Owners of collection NFTs visit our Dapp that first displays all NFTs they own (we're using NFTPort, Covalent and our own chain scanner here). They choose one NFT they'd like to get a background image for and choose a style NFT, from here on we're referring to them as "requestors". We're extracting image- and metadata from the chosen piece and render an expected artwork outcome using local entropy (a hash of the collection's address & the token id) inside the requestor's browser. If the requestor is fine with the result, we're uploading its PNG representation to nft.storage. The requestor can now already use that image, but they aren't owning it yet. Image- and metadata aren't directly verifiable on chain, so to officially mint the header image on the Splice contract we need another trust layer.

Upon minting, requestors send a minting input to the Splice contract, containing

- the extracted parameters needed for the render code, like palette, metadata traits, stroke width etc.
- a hash of all the NFTs metadata and all generative parameters 
- the used algorithm NFT id
- the IPFS hash of their pre-rendered PNG representation

An (chainlink) oracle independently extracts the same information as the requestor did locally, compares it with what they requested on chain, renders the artwork using the same algorithm and compares the final result to the IPFS hash the user provided. If the oracle comes to the same result as the requestor, it sends back a "green light" to the Splice contract. 

Once confirmed, the requestor initiates the final mint. The contract checks whether the mint request is green lit and mints the piece to the requestor.

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

### long term
