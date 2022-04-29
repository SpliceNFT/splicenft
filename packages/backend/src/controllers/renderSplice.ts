import { Request, Response } from 'express';
import Artwork from '../lib/Artwork';
import ImageCallback from '../lib/ImageCallback';
import { styleCache } from '../lib/StyleCache';

export const renderSplice = async (req: Request, res: Response) => {
  const networkId = parseInt(req.params.network);
  const tokenId = req.params.tokenid;
  const invalidate = req.headers['cache-control'] === 'must-revalidate';

  const cache = styleCache.getCache(networkId);

  if (!cache) return res.status(500).send(`network ${networkId} not supported`);
  try {
    Artwork(cache, tokenId, ImageCallback(res), invalidate);
  } catch (e: any) {
    console.error(`couldnt create image :( ${e.message}`);
    res.status(500).send(`couldnt create image :( ${e.message}`);
  }
};
