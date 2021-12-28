import { Readable } from 'stream';
import * as Cache from './Cache';
import Metadata from './Metadata';
import Render from './render';
import { StyleMetadataCache } from './StyleCache';

export default async function Artwork(
  styleCache: StyleMetadataCache,
  spliceTokenId: string,
  callback: (err: any | null, stream: Readable) => unknown
) {
  const key = `${styleCache.network}/splice/images/${spliceTokenId}.png`;

  const stream = await Cache.lookupBinary(key);
  if (stream) {
    return callback(null, stream);
  }

  const spliceMetadata = await Cache.withCache(
    `${styleCache.network}/splice/metadata/${spliceTokenId}.json`,
    async () => Metadata(styleCache, spliceTokenId)
  );
  const style = styleCache.getStyle(spliceMetadata.splice.style_token_id);
  if (!style) throw new Error('no style on metadata ?!');
  const renderer = await style.getRenderer();

  Render(
    renderer,
    {
      colors: spliceMetadata.splice.colors.map((c) => c.rgb),
      dim: { w: 1500, h: 500 },
      randomness: spliceMetadata.splice.randomness
    },
    (err: any | null, buffer: Buffer) => {
      if (!err) {
        Cache.store(key, buffer);
      }
      callback(err, Readable.from(buffer));
    }
  );
}
