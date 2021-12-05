import { StyleNFTResponse } from '@splicenft/common';
import { Request, Response } from 'express';
import * as Cache from '../lib/Cache';
import { StyleCache } from '../lib/StyleCache';

export function all(styleCache: StyleCache) {
  return async (req: Request, res: Response) => {
    const networkId = parseInt(req.params.network);

    const cache = styleCache.getCache(networkId);
    if (!cache)
      return res.status(500).send(`network ${networkId} not supported`);

    const promises = cache.getStyles().map((style) => {
      return (async () => {
        return {
          style_token_id: style.tokenId,
          code_url: `/styles/${networkId}/${style.tokenId}`,
          metadata: style.getMetadata()
        };
      })();
    });
    const styles: StyleNFTResponse[] = await Promise.all(promises);

    res.json(styles);
  };
}

export function details(styleCache: StyleCache) {
  return async (req: Request, res: Response) => {
    const networkId = parseInt(req.params.network);
    const styleTokenId = parseInt(req.params.style_token_id);

    const cache = styleCache.getCache(networkId);
    if (!cache)
      return res.status(500).send(`network ${networkId} not supported`);

    const style = cache.getStyle(styleTokenId);
    if (!style) {
      return res
        .status(500)
        .send(`style ${styleTokenId} not available on network ${networkId}`);
    }
    const key = `${networkId}/styles/${styleTokenId}/code.js`;
    let code = await Cache.lookupString(key);
    if (!code) {
      code = await style.getCode();
      Cache.store(key, code);
    }
    res.json({
      style_token_id: style.tokenId,
      metadata: style.getMetadata(),
      code
    });
  };
}
