import { Splice, SpliceNFT } from '@splicenft/common';
import { StyleCache, StyleMetadataCache } from './StyleCache';

const Metadata = async (
  splice: Splice,
  styleCache: StyleMetadataCache,
  tokenId: number
): Promise<SpliceNFT> => {
  const heritage = await splice.getHeritage(tokenId);
  if (!heritage) throw `no heritage for token ${tokenId}`;

  const style = styleCache.getStyle(heritage.style_token_id.toString());
  if (!style) throw `style token seems corrupt`;

  const randomness = Splice.computeRandomness(
    heritage.origin_collection,
    heritage.origin_token_id.toString()
  );

  return {
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
};

export default Metadata;
