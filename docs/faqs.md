# FAQs

## General 

### Wen mainnet?

Very soon. At the moment we're focused on getting feedback on testnet, and starting to build a community of artists and collectors.

### Ok, wen L2?

That's the right question! We can easily deploy Splice on Optimism or Polygon. Our current verification process, the process of proving ownership of an NFT seed, works if we restrict minting to seed NFTs on a particular network. RC721 bridging and (multi?-) cross chain messaging is tricky at the moment, but also a challenge we may undertake.

### Solana, Tezos?

If you feel Splice should support non-EVM chains, please join our Discord and discuss it with us. Even better: if you're a seasoned Solana dev, join our team :)

## Styles 

### I'm an artist and I'd like to create a style

Great to meet you! Please reach out on discord. Meanwhile, check out our doc for artists, or have a look at a few examples (the `/renderers` folder). We're now building [a sandbox for artists](https://github.com/SpliceNFT/splicenft/issues/106) that should make building on Splice a breeze. 

### Can I use SVGs in my styles?

[It should be absolutely possible](https://discourse.processing.org/t/importing-svg-to-p5-js-sketch/24072/11). Note: because style code doesn't load external resources, all your dependencies **must** be embedded in your code base (base64 encoded data urls or svg data should do the trick).

### Can styles be animated?

In theory yes, but at the moment we've disabled the p5.loop outside the render context. If you're eager for this functionality (or any other functionality), please reach out to us on discord.

