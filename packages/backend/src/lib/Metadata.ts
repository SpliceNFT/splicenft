import { SpliceNFT } from '@splicenft/common';
import * as Cache from './Cache';
import { extractOriginFeatures, getOriginMetadata } from './Origin';
import { getSplice } from './SpliceContracts';
import { StyleMetadataCache } from './StyleCache';

const Metadata = async (
  styleCache: StyleMetadataCache,
  tokenId: number
): Promise<SpliceNFT> => {
  const key = `${styleCache.network}/splice/metadata/${tokenId}.json`;

  const cached = await Cache.lookupJSON<SpliceNFT>(key);
  if (cached) {
    return cached;
  }
  const splice = getSplice(styleCache.network);
  const heritage = await splice.getHeritage(tokenId);
  if (!heritage) throw new Error(`no heritage for token ${tokenId}`);
  const originNftContract = splice.getOriginNftContract(
    heritage.origin_collection
  );
  const originNftName = await originNftContract.name();

  const style = styleCache.getStyle(heritage.style_token_id.toString());
  if (!style) throw new Error(`style token seems corrupt`);

  const originMetadata = await getOriginMetadata(
    originNftContract,
    heritage.origin_token_id
  );
  if (!originMetadata) throw new Error(`couldnt get origin metadata`);
  const originFeatures = await extractOriginFeatures(heritage, originMetadata);
  const ret = {
    name: `Splice of ${originNftName} #${heritage.origin_token_id}`,
    description: `This Splice was created from ${originNftName} #${
      heritage.origin_token_id
    } using style "${style.getMetadata().name}".`,
    image: `${process.env.SERVER_BASE_URL}/splice/${styleCache.network}/${tokenId}/image.png`,
    external_url: `${process.env.SPLICE_BASE_URL}/#/nft/${heritage.origin_collection}/${heritage.origin_token_id}`,
    properties: {
      style_name: style.getMetadata().name
    },
    splice: {
      colors: originFeatures.palette,
      randomness: originFeatures.randomness,
      origin_collection: heritage.origin_collection,
      origin_token_id: heritage.origin_token_id.toString(),
      style_collection: style.getCollectionAddress(),
      style_metadata_url: style.getMetadataUrl(),
      style_token_id: style.tokenId.toString()
    }
  };
  Cache.store(key, ret);

  return ret;
};

export default Metadata;
