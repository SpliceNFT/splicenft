import { BANNER_DIMS, DrawArgs, NFTItem } from '@splicenft/common';
import * as Cache from './Cache';
import { fetchOriginMetadata } from './fetchOriginMetadata';
import { IImageCallback } from './ImageCallback';
import Metadata from './Metadata';
import { RenderAndCache } from './render';
import { StyleMetadataCache } from './StyleCache';

export default async function Artwork(
  styleCache: StyleMetadataCache,
  spliceTokenId: string,
  callback: IImageCallback,
  invalidate = false
): Promise<void> {
  const imageKey = `${styleCache.network}/splice/images/${spliceTokenId}.png`;
  if (invalidate) {
    await Cache.remove(imageKey);
  }

  const spliceMetadata = await Cache.withCache(
    `${styleCache.network}/splice/metadata/${spliceTokenId}.json`,
    async () => await Metadata(styleCache, spliceTokenId),
    invalidate
  );

  const stream = await Cache.lookupBinary(imageKey);
  if (stream) {
    return callback(null, stream, []);
  }

  const firstOrigin = spliceMetadata.splice.origins[0];
  const originMetadata = await fetchOriginMetadata(
    styleCache.network,
    firstOrigin.collection,
    firstOrigin.token_id,
    invalidate
  );

  const nftItem: NFTItem = {
    contract_address: firstOrigin.collection,
    token_id: firstOrigin.token_id.toString(),
    metadata: originMetadata
  };
  const drawArgs: DrawArgs = {
    dim: BANNER_DIMS,
    params: {
      colors: spliceMetadata.splice.colors,
      randomness: spliceMetadata.splice.randomness,
      nftItem
    }
  };

  const style = styleCache.getStyle(spliceMetadata.splice.style_token_id);
  if (!style) throw new Error('no style on metadata ?!');
  const renderer = await style.getRenderer();

  RenderAndCache(imageKey, drawArgs, renderer, callback);
}
