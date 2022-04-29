import { Transfer } from '@splicenft/common';
import { Request, Response } from 'express';
import { withCache } from '../lib/Cache';
import { extractOriginFeatures } from '../lib/extractOriginFeatures';
import { fetchOriginMetadata } from '../lib/fetchOriginMetadata';

export async function extractColors(req: Request, res: Response) {
  const networkId = parseInt(req.params.network);
  const collection = req.params.collection;
  const token_id = req.params.token_id;
  const invalidate = req.headers['cache-control'] === 'must-revalidate';

  try {
    const metadata = await fetchOriginMetadata(
      networkId,
      collection,
      token_id,
      invalidate
    );

    const features = await withCache<Transfer.OriginFeatures>(
      `${networkId}/nft/${collection}/${token_id}/features.json`,
      async () => {
        return extractOriginFeatures(
          {
            collection,
            token_id
          },
          metadata
        );
      },
      invalidate
    );

    res.status(200).json(features);
  } catch (e: any) {
    const err = `couldnt load colors for token ${collection}/${token_id} on ${networkId}. Message: ${e.message}`;
    console.error(err);

    res.status(500).send(err);
  }
}
