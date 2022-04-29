import { SpliceNFT } from '@splicenft/common';
import { Request, Response } from 'express';
import { withCache } from '../lib/Cache';
import Metadata from '../lib/Metadata';
import { styleCache } from '../lib/StyleCache';

export const spliceMetadata = async (req: Request, res: Response) => {
  const networkId = parseInt(req.params.network);
  const tokenId = req.params.tokenid;
  const invalidate = req.headers['cache-control'] === 'must-revalidate';
  const cache = styleCache.getCache(networkId);

  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  try {
    const metadata = await withCache<SpliceNFT>(
      `${networkId}/splice/metadata/${tokenId}.json`,
      async () => Metadata(cache, tokenId, invalidate),
      invalidate
    );

    metadata.image = `${process.env.SERVER_BASE_URL}/splice/${networkId}/${tokenId}/image.png`;
    res.status(200).send(metadata);
  } catch (e: any) {
    res.status(500).send(`couldn't create metadata :( ${e.message}`);
  }
};
