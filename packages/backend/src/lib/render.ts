/* eslint-disable @typescript-eslint/ban-types */
import p5 from '@mattheath/p5js-node';
import { Renderer, RGB } from '@splicenft/common';

export default function (
  renderer: Renderer,
  drawProps: {
    colors: RGB[];
    dim: {
      w: number;
      h: number;
    };
    randomness: number;
  },
  callback: Function
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new p5((p5: any) => {
    p5.setup = function () {
      p5.createCanvas(drawProps.dim.w, drawProps.dim.h);
      if (drawProps.randomness) {
        p5.randomSeed(drawProps.randomness);
      }
    };

    p5.draw = function () {
      try {
        renderer({
          p5,
          dim: drawProps.dim,
          colors: drawProps.colors
        });

        //setTimeout(() => {
        callback(null, p5.canvas.createPNGStream());
        //}, 250);
      } catch (e) {
        callback(e, null);
      }
    };
  });
}
