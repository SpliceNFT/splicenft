import { StyleNFTResponse } from '@splicenft/common';
import { Request, Response } from 'express';
import { styleCache } from '../lib/StyleCache';

export const allStyles = async (req: Request, res: Response) => {
  const networkId = parseInt(req.params.network);

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const styles: StyleNFTResponse[] = cache.getStyles().map((style) => {
    return {
      style_token_id: style.tokenId,
      code_url: `/styles/${networkId}/${style.tokenId}`,
      metadata: style.getMetadata()
    };
  });

  res.json(styles);
};
