import { Request, Response } from 'express';
import * as Cache from '../lib/Cache';
import { styleCache } from '../lib/StyleCache';

export const styleDetails = async (req: Request, res: Response) => {
  const networkId = parseInt(req.params.network);
  const styleTokenId = parseInt(req.params.style_token_id);

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

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
