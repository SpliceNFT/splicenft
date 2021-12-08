# Splice for Artists

If you're a generative artist interested in creating a Splice style NFT, welcome! Below is an outline of how Splice works, and how we can work together. If you have questions that remain unanswered, or if you want to get started building with Splice, please don't hesitate to contact us on [our discord](https://discord.gg/JhtT87y2BA). 

## Writing style code

We're currently supporting style code that has been written using the [p5 library](https://p5js.org/). All styles follow the same boilerplate:

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
You can see a few examples of Splice style code in our repository (`/renderers`). The code used on the dapp is actually stored on IPFS. 

(While you *could* write your style using Typescript, that would add another layer of complexity: the style code itself is instantiated inside a browser context, and if it contains TS, it would  fail to load. If you're building a style using TS, you'll need to make sure  your code is transpiled to Javascript before it's minted. If you don't want to wrap your head around that, just write styles in plain JS.)

A really simple (but not pretty) example is our flower code:

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

### Ownership

Styles on Splice are minted as NFTs that can be bought and sold. All fees that accrue when collectors mint Splices, or sell minted results on secondary markets, will be transferred to the **current style owner**. 

That means as an artist, you (or someone you choose, like a curator) can mint your style and then sell it as a **style token**. A style NFT isn't just a new kind of asset that potentially generate a stream of revenue from primary and secondary sales, but more importantly, a new way for artists to benefit from their work.

## Commissions and Ownership

Our Splice contract distributes 85% of primary sales to the artist (or whoever owns the style NFT) and 15% to the platform protocol. On secondary sales, the artist (or whoever owns the style NFT) takes 10%.

On a sidenote, the Splice contract implements the [EIP-2981 NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981) that signals secondary marketplaces who should receive royalties. EIP 2981 is a rather new, non-binding way that's not picked up by major platforms like OpenSea yet but likely will lead the effort to streamline royalty payments. 

All royalty payouts that happen to be paid to the contract owner directly (which is the Splice protocol) in the old-fashioned way will be forwarded to artists on a monthly basis.

## Now and Upcoming

Until now (Dec 2021), we've concentrated on building the backend and contract logic behind Splice. After going live on mainnet, we'll focus on tools that simplify the process of making styles, making it just that much easier for artists to build with us.
