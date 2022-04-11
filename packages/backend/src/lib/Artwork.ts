import { BANNER_DIMS, DrawArgs, NFTItem, NFTMetaData } from '@splicenft/common';
import { fetchOriginMetadata } from '../controllers/metadata';
import * as Cache from './Cache';
import { IImageCallback } from './ImageCallback';
import Metadata from './Metadata';
import { RenderAndCache } from './render';
import { StyleMetadataCache } from './StyleCache';

export default async function Artwork(
  styleCache: StyleMetadataCache,
  spliceTokenId: string,
  callback: IImageCallback
): Promise<void> {
  const spliceMetadata = await Cache.withCache(
    `${styleCache.network}/splice/metadata/${spliceTokenId}.json`,
    async () => await Metadata(styleCache, spliceTokenId)
  );
  const key = `${styleCache.network}/splice/images/${spliceTokenId}.png`;

  const stream = await Cache.lookupBinary(key);
  if (stream) {
    return callback(null, stream, []);
  }

  const style = styleCache.getStyle(spliceMetadata.splice.style_token_id);
  if (!style) throw new Error('no style on metadata ?!');

  const renderer = await style.getRenderer();

  const firstOrigin = spliceMetadata.splice.origins[0];
  const cachedOriginMetadata = await Cache.withCache<NFTMetaData>(
    `${styleCache.network}/nft/${firstOrigin.collection}/${firstOrigin.token_id}/metadata.json`,
    () =>
      fetchOriginMetadata(
        styleCache.network,
        firstOrigin.collection,
        firstOrigin.token_id
      ),
    false
  );

  const nftItem: NFTItem = {
    contract_address: firstOrigin.collection,
    token_id: firstOrigin.token_id.toString(),
    metadata: cachedOriginMetadata
  };
  const drawArgs: DrawArgs = {
    dim: BANNER_DIMS,
    params: {
      colors: spliceMetadata.splice.colors,
      randomness: spliceMetadata.splice.randomness,
      nftItem
    }
  };
  RenderAndCache(key, drawArgs, renderer, callback);
}
