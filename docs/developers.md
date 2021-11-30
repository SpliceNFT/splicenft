# Splice for Developers
 
## Project Setup

## The Contracts

## Style Features

### Collection constraints

### Minting Allowlists

## Dynamic Pricing

## Subgraphs

We tried to build the splice contract as gas efficient as possible, so we're not storing much on chain: each splice NFT contains a hash to quickly prove its origins and the style token id that had been chosen for minting. 


## The commons

## Backend


Most popular collections have usually "frozen" their image date once they minted out or even within the minting phase. 


# How it's made

This project is built on Typescript and Solidity (>0.8)

### NFTPort and Covalent 
We're using their APIs to get a list of a user's mainnet (testnet) NFTs. But for our demo, we need indexed assets on kovan, and wrote our own chain scanning code for that."One idea of Splice is to let users mint NFTs of existing collections which have to be "registered" on our contract so we can distribute minting fee shares - that's why we would need some query that could get all of a user's NFTs, filtered by a list of collection addresses. 

### ERC721 Test-NFT contracts
To demonstrate the site's functionality, Splice needs sample collections on the Kovan chain. We've created 2 fake collections representing metadata of Cool Cats and BAYC that everyone is allowed to mint: https://kovan.etherscan.io/token/0x6334d2cbc3294577bb9de58e8b1901d6e3b97681 / https://kovan.etherscan.io/token/0x6d96aAE79399C6f2630d585BBb0FCF31cCa88fa9 

### IPFS & nft.storage
This was the most helpful tool here: we're pushing the rendered artworks as blobs  + some custom metadata to nft.storage and already got a pinned and accessible version ready, great. On first thought we wanted to validate on our (oraclized) backend that the asset CIDs from the frontend match the ones on the backend, but turns out rendering on the browser and on a server (node-p5) lead to slightly different results. Therefore we're writing plain "string" CIDs for the individual asset metadata into our contract (we have written CIDv0 byte optimized code but that's not compatible to CIDv1 / dag-pb)   

### Chainlink
To make Splice a trusted system, we're verifying the metadata and generated image data on the server side. We've created a dedicated contract to interact with Chainlink's HttpGet jobs, and even built a clever way to return the token_id and a validness flag (boolean) within one bytes32 response. Unfortunately our backend never got requested by the Kovan Chainlink oracle (even though it got enough LINK) so we had to mock up that part for our demo: right now our backend validator is triggered by the user who wants to mint, and simply greenlights a mint once it has verified that metadata and image are correct.

### Rendering
For the rendering we're using p5 inside React & p5-node server side + the usual suspects like expressjs (wanted to use vercel but vercel can't compile everything needed for p5 rendering, so atm the validation code runs on one of our DigitalOcean Droplets), pnpm (best pm in the world) and of course Fleek for totally decentralized IPFS hosting.

We're quite proud to have built a true monorepo that can be built (after setting some env vars) using a pnpm install && pnpm run -r build instruction. Some common code to interact with our contracts is extracted to a dedicated package (@splicenft/common) and it even yields typechain information to clients.