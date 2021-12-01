# FAQs

## General 

### Why?

First, it's fun. Second, it makes absolute sense. Third, [being a finalist at an EthOnline hackathon](https://showcase.ethglobal.com/ethonline2021/splice) somewhat **forces** you to continue going after an idea. 

### Wen mainnet?

Very soon. We first must collect some feedback, build at least a tiny community that we can ask for their opinions and then we're more than prepared to launch Splice on the most expensive blockchain out there.

### Ok, wen L2?

That's the right question! Splice actually is pretty special: you can only mint a Splice when our contract can prove that you're owning the origins. So, we easily could just deploy Splice on Optimism or Polygon but without taking any other measures that would restrict it to mint only on these networks. ERC721 bridging and (multi?-) cross chain messaging is a problem class of its own, to be honest. While we have thought about quite thoroughly, we haven't got plans to make this our first priority (but our third).

### Solana, Tezos?

Well, no. If you feel like Splice must be a protocol that supports non-EVM chains, join our Discord and discuss it with us. Even better: if you're a seasoned Solana dev, join our team :)

## Styles 

### I'm an artist and I feel I must write a style.

That's so awesome <3!! Checkout our docs for artists, have a look at the styles that Emily has built during EthOnline (the `/renderers` folder) and just start tinkering. We're going to [provide a sandbox for artists](https://github.com/SpliceNFT/splicenft/issues/106) that should make building on splice a breeze. 

### Can I use SVGs in my styles?

We never tried it yet, but [it should be absolutely possible](https://discourse.processing.org/t/importing-svg-to-p5-js-sketch/24072/11). Note, that style code will **never** be able to load external resources, though, so all your dependencies **must** be embedded in your code base (base64 encoded data urls or svg data should do the trick).

### Can styles be animated?

Have you ever seen an animated Twitter banner image?! Ok, in theory: yes, in practice: not too soon (we're disabling the p5.loop outside of the render context).

