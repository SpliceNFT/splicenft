import { Readable, PassThrough } from 'stream';
import * as Cache from './Cache';
import Metadata from './Metadata';
import Render from './render';
import { StyleMetadataCache } from './StyleCache';

export default async function Artwork(
  styleCache: StyleMetadataCache,
  spliceTokenId: string,
  callback: (err: any | null, stream: Readable) => void
): Promise<void> {
  const key = `${styleCache.network}/splice/images/${spliceTokenId}.png`;

  const stream = await Cache.lookupBinary(key);
  if (stream) {
    return callback(null, stream);
  }

  const spliceMetadata = await Cache.withCache(
    `${styleCache.network}/splice/metadata/${spliceTokenId}.json`,
    async () => await Metadata(styleCache, spliceTokenId)
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
    (err: any | null, stream: Readable) => {
      if (!err) {
        //https://stackoverflow.com/questions/19553837/node-js-piping-the-same-readable-stream-into-multiple-writable-targets
        const ptCache = new PassThrough();
        const ptRes = new PassThrough();
        stream.pipe(ptCache);
        stream.pipe(ptRes);
        Cache.store(key, ptCache).then(() => {
          callback(err, ptRes);
        });
      } else {
        console.error('Artwork: RENDERING ERROR', err);
        callback(err, stream);
      }
    }
  );
}
