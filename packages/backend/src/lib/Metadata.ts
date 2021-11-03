import { Splice, SpliceNFT } from '@splicenft/common';
import { getSplice } from './SpliceContracts';
import { StyleMetadataCache } from './StyleCache';
import * as Cache from './Cache';

const Metadata = async (
  styleCache: StyleMetadataCache,
  tokenId: number
): Promise<SpliceNFT> => {
  const key = `${styleCache.network}/${tokenId}`;

  const cached = await Cache.lookup<SpliceNFT>(key, 'metadata.json', 'json');
  if (cached) {
    return cached as SpliceNFT;
  }

  const splice = getSplice(styleCache.network);
  const heritage = await splice.getHeritage(tokenId);
  if (!heritage) throw new Error(`no heritage for token ${tokenId}`);

  const style = styleCache.getStyle(heritage.style_token_id.toString());
  if (!style) throw new Error(`style token seems corrupt`);

  const randomness = Splice.computeRandomness(
    heritage.origin_collection,
    heritage.origin_token_id.toString()
  );

  const ret = {
    name: `Splice of ${heritage.origin_collection} / ${heritage.origin_token_id}`,
    description: `This Splice was created by using token ${heritage.origin_token_id} of ${heritage.origin_collection}.`,
    image: '',
    properties: {
      colors: [],
      origin_collection: heritage.origin_collection,
      origin_token_id: heritage.origin_token_id.toString(),
      randomness,
      style_collection: style.getCollectionAddress(),
      style_metadata_url: style.getMetadataUrl(),
      style_token_id: style.tokenId.toString()
    }
  };
  Cache.store(key, 'metadata.json', 'json', ret);

  return ret;
};

export default Metadata;
