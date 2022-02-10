import { BANNER_DIMS, DrawArgs } from '@splicenft/common';
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

  const drawArgs: DrawArgs = {
    dim: BANNER_DIMS,
    params: {
      colors: spliceMetadata.splice.colors,
      randomness: spliceMetadata.splice.randomness
    }
  };
  RenderAndCache(key, drawArgs, renderer, callback);
}
