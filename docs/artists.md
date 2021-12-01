# Splice for Artists

Artists will be the heart of Splice: Splice's success depends solely on contributions of generative styles that make sense of NFT input parameters. If you're into programmatic arts, have a great idea, want to be part of the game or are wondering how to get started, we can only recommend to get in touch with us first: until Dec 2021 we concentrated on building the ecosystem and the toolchain that makes style creations simple has yet to be built. 

If you feel adventurous, our initial styles of Emily Weil will help you to get an idea of how Splice styles work. We've committed them to our repository (`/renderers`) for reference (the code that's used in the wild is actually delivered by IPFS). 

## Writing style code

We're currently only supporting style code that has been written using the [p5 library](https://p5js.org/). All styles follow the same boilerplate:

```ts
import p5Types from 'p5';

type RGB = [number, number, number];

interface DrawProps {
  p5: p5Types;
  colors: RGB[]; //an array of dominant colors 
  dim: { w: number; h: number };
}

function ({ p5, colors, dim }: DrawProps) {
  //your code here
}
```

While you *could* write your styles using Typescript that would add another layer of complexity: the style code itself is instantiated inside a browser context and if it contained TS that would actually fail. So if you were to build a TS based style (we'd love to see you doing so), you must make sure that your code is transpiled to Javascript before it can be minted as a style. 

If you don't want to wrap your head around that, just write styles in plain JS for now, just as Emily did. A really simple (but not pretty) example is our flower code:

```js
function ({ p5, colors, dim }) {
  const primaryColor = colors[0];

  p5.background(p5.color(primaryColor[0], primaryColor[1], primaryColor[2]));

  const otherColors = colors.filter((c, i) => i != 0);
  // A design for a simple flower
  p5.translate(dim.w / 2, dim.h / 2);
  p5.noStroke();
  for (let i = 0; i < 10; i++) {
    const color = otherColors[i % otherColors.length];
    p5.fill(p5.color(color[0], color[1], color[2]));
    p5.ellipse(0, 0, 50, dim.w / 1.2);
    p5.rotate(p5.PI / 10);
  }
  p5.noLoop();
}
```

## Fees, Commissions and Ownership

Our Splice contract's default setting distributes 85% minting fee to the current style owner (initially the artist) and 15% to the protocol (that's us or a Splice DAO to be created). This share is actually updateable by the contract's owner (that's us) but we've built in a hardcoded rule that will never allow us to claim more than 25%. In fact, we're planning to even lower the protocol's share significantly once it's proven that the Splice protocol works fine.

### Royalties 

We all know that the "big money" is earnt by secondary sales. In case of Splice artworks it's a little tricky: they don't make too much sense standalone but only in combination with their origin NFT. Nevertheless, we'll setup a royalty scheme on our OpenSea collection as high as 10%. Now, as you may or may not know, there's no agreed on way of sharing royalties that are collected by a base collection immediately to the respective artists. OpenSea currently pays out collected royalties every couple of weeks to the collection owners (that's us) and leaves it open to them to distribute them manually. That's basically what we're up to, and this is not different than what e.g. ArtBlocks has proven to work fine. 

The NFT space right now [is rolling out](https://github.com/ethereum/EIPs/issues/2907) a royalty signalling interface scheme ([EIP-2981](https://eips.ethereum.org/EIPS/eip-2981)) that allows to at least signal the royalty payer (OpenSea) where to send funds. That standard is pretty new and it's unclear if OpenSea will adhere to it very soon. We're aware of EIP-2981 and plan to implement it asap to reduce the trust artists have to give us for distributing royalty shares correctly.

### Ownership

a fancy aspect of the Splice protocol is that styles are NFTs themselves. You as an artist can decide to mint a style (or, more concisely, contact a trusted curator [who supports you](https://github.com/SpliceNFT/splicenft/issues/130) minting that style on the Splice style contract) and do with it whatever you want. All fees that accrue when users mint on that style or sell the minted results on secondary markets will be transferred to the **current style owner**. That effectively means that you as an artist can sell your **style token** to anyone instead of hoping to get paid in minting fees or royalties later. If that's a smart move depends on you, your style and the impact it has on users.

