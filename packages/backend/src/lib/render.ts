/* eslint-disable @typescript-eslint/ban-types */
import p5 from '@mattheath/p5js-node';
import { Histogram } from '@splicenft/colors';
import { Renderer } from '@splicenft/common';

export default function (
  drawProps: {
    dim: {
      w: number;
      h: number;
    };
    colors: Histogram;
    randomness: number;
  },
  renderer: Renderer,
  callback: Function
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new p5((p5: any) => {
    p5.setup = function () {
      p5.pixelDensity(1);
      p5.createCanvas(drawProps.dim.w, drawProps.dim.h, p5.P2D);
      if (drawProps.randomness) {
        p5.randomSeed(drawProps.randomness);
      }
    };
    p5.draw = function () {
      const params = {
        randomness: drawProps.randomness,
        colors: drawProps.colors.map((c) => ({
          ...c,
          color: p5.color(c.hex)
        }))
      };

      try {
        p5.noLoop();
        renderer({
          p5,
          dim: drawProps.dim,
          colors: drawProps.colors.map((c) => c.rgb),
          params
        });

        //https://github.com/tmpvar/node-canvas/blob/master/Readme.md
        callback(null, p5.canvas.createPNGStream());
      } catch (e) {
        callback(e, null);
      }
    };
  });
}
