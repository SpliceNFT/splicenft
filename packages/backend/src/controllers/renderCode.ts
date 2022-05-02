import { GRAYSCALE_HISTOGRAM } from '@splicenft/colors';
import { Request, Response } from 'express';
import ImageCallback from '../lib/ImageCallback';
import { Render } from '../lib/render';

export async function renderCode(req: Request, res: Response) {
  const code = req.body;

  try {
    const renderer = Function(`"use strict";return (${code})`)();
    Render(
      {
        dim: { w: 1500, h: 500 },
        params: {
          colors: GRAYSCALE_HISTOGRAM,
          randomness: 1
        }
      },
      renderer,
      ImageCallback(res)
    );
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
}
