/* eslint-disable @typescript-eslint/ban-types */
import p5 from '@mattheath/p5js-node';
import { DrawArgs, DrawProps, NFTTrait, Renderer } from '@splicenft/common';
import { PassThrough, Readable } from 'stream';
import * as Cache from './Cache';
import { IImageCallback } from './ImageCallback';

export function Render(
  drawArgs: DrawArgs,
  renderer: Renderer,
  callback: IImageCallback
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new p5((p5: any) => {
    p5.setup = function () {
      p5.pixelDensity(1);
      p5.createCanvas(drawArgs.dim.w, drawArgs.dim.h, p5.P2D);
      p5.randomSeed(drawArgs.params.randomness);
    };
    p5.draw = function () {
      const drawProps: DrawProps = {
        ...drawArgs,
        p5,
        colors: drawArgs.params.colors.map((c) => c.rgb),
        params: {
          ...drawArgs.params,
          colors: drawArgs.params.colors.map((c) => ({
            color: p5.color(c.hex),
            ...c
          }))
        }
      };
      try {
        p5.noLoop();
        const traits = renderer(drawProps);

        //https://github.com/tmpvar/node-canvas/blob/master/Readme.md
        callback(null, p5.canvas.createPNGStream(), traits || []);
      } catch (e) {
        callback(e, null, []);
      }
    };
  });
}

export function RenderAndCache(
  key: string,
  drawArgs: DrawArgs,
  renderer: Renderer,
  callback: IImageCallback
) {
  Render(
    drawArgs,
    renderer,
    (err: any | null, readable: Readable | null, traits: NFTTrait[]) => {
      if (readable && !err) {
        const ptCache = new PassThrough();
        const ptRes = new PassThrough();
        readable.pipe(ptCache);
        readable.pipe(ptRes);
        Cache.store(key, ptCache).then(() => {
          callback(err, ptRes, traits);
        });
      } else {
        console.error('Render: RENDERING ERROR', err);
        callback(err, readable, traits);
      }
    }
  );
}
