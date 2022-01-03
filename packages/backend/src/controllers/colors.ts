import { erc721, NFTMetaData, Transfer } from '@splicenft/common';

import { Request, Response } from 'express';
import { withCache } from '../lib/Cache';
import { extractOriginFeatures, getOriginMetadata } from '../lib/Origin';
import { providerFor } from '../lib/SpliceContracts';

export async function extractColors(req: Request, res: Response) {
  const networkId = parseInt(req.params.network);
  const collection = req.params.collection;
  const token_id = req.params.token_id;

  try {
    const provider = providerFor(networkId);
    if (!provider)
      throw new Error(`Splice is not available for network ${networkId}`);

    const metadata = await withCache<NFTMetaData>(
      `${networkId}/nft/${collection}/${token_id}/metadata.json`,
      async () => {
        const contract = erc721(provider, collection);
        const metadata = await getOriginMetadata(contract, token_id);
        if (!metadata)
          throw new Error(
            `can't read metadata for ${token_id} on ${collection}`
          );
        return metadata;
      }
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
      }
    );

    res.status(200).json(features);
  } catch (e: any) {
    const err = `couldnt load colors :( ${e.message}`;
    console.error(err);

    res.status(500).send(err);
  }
}
