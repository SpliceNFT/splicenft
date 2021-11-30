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