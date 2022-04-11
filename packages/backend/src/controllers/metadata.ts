import { erc721, NFTMetaData, SpliceNFT } from '@splicenft/common';
import { BigNumberish } from 'ethers';
import { Request, Response } from 'express';
import { withCache } from '../lib/Cache';
import Metadata from '../lib/Metadata';
import { getOriginMetadata } from '../lib/Origin';
import { providerFor } from '../lib/SpliceContracts';
import { StyleCache } from '../lib/StyleCache';

export const fetchOriginMetadata = async (
  networkId: number,
  collection: string,
  token_id: BigNumberish
): Promise<NFTMetaData> => {
  const provider = providerFor(networkId);
  if (!provider)
    throw new Error(`Splice is not available for network ${networkId}`);

  const contract = erc721(provider, collection);
  const metadata = await getOriginMetadata(contract, token_id);
  if (!metadata)
    throw new Error(`can't read metadata for ${token_id} on ${collection}`);
  return metadata;
};

export function nftMetadata() {
  return async (req: Request, res: Response) => {
    const networkId = parseInt(req.params.network);
    const collection = req.params.collection;
    const token_id = req.params.token_id;

    try {
      const invalidate = req.headers['cache-control'] === 'must-revalidate';
      const metadata = await withCache<NFTMetaData>(
        `${networkId}/nft/${collection}/${token_id}/metadata.json`,
        () => fetchOriginMetadata(networkId, collection, token_id),
        invalidate
      );
      res.status(200).send(metadata);
    } catch (e: any) {
      res.status(500).send(`couldn't load metadata :( ${e.message}`);
    }
  };
}

export function spliceMetadata(styleCache: StyleCache) {
  return async (req: Request, res: Response) => {
    const networkId = parseInt(req.params.network);
    const tokenId = req.params.tokenid;

    const cache = styleCache.getCache(networkId);

    if (!cache)
      return res.status(500).send(`network ${networkId} not supported`);

    try {
      const metadata = await withCache<SpliceNFT>(
        `${networkId}/splice/metadata/${tokenId}.json`,
        async () => Metadata(cache, tokenId)
      );

      metadata.image = `${process.env.SERVER_BASE_URL}/splice/${networkId}/${tokenId}/image.png`;
      res.status(200).send(metadata);
    } catch (e: any) {
      res.status(500).send(`couldn't create metadata :( ${e.message}`);
    }
  };
}
