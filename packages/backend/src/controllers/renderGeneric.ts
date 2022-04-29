import { GRAYSCALE_HISTOGRAM } from '@splicenft/colors';
import { Request, Response } from 'express';
import ImageCallback from '../lib/ImageCallback';
import { Render } from '../lib/render';
import { styleCache } from '../lib/StyleCache';

export const renderGeneric = async (req: Request, res: Response) => {
  const networkId = parseInt(req.params.network);
  const styleTokenId = parseInt(req.params.style_token_id);

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const style = cache.getStyle(styleTokenId);
  if (!style) {
    return res
      .status(404)
      .send(`style ${styleTokenId} not available on network ${networkId}`);
  }
  const renderer = await style.getRenderer();

  try {
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
};
