import { SpliceNFT } from '@splicenft/common';
import * as Cache from './Cache';
import { extractOriginFeatures, getOriginMetadata } from './Origin';
import { getSplice } from './SpliceContracts';
import { StyleMetadataCache } from './StyleCache';

const Metadata = async (
  styleCache: StyleMetadataCache,
  spliceTokenId: string
): Promise<SpliceNFT> => {
  const key = `${styleCache.network}/splice/metadata/${spliceTokenId}.json`;

  const cached = await Cache.lookupJSON<SpliceNFT>(key);
  if (cached) {
    return cached;
  }
  const splice = getSplice(styleCache.network);
  const provenance = await splice.getProvenance(spliceTokenId);
  if (!provenance) throw new Error(`no provenance for token ${spliceTokenId}`);
  const originNftContract = splice.getOriginNftContract(
    provenance.origin_collection
  );
  const originNftName = await originNftContract.name();

  const style = styleCache.getStyle(provenance.style_token_id);
  if (!style) throw new Error(`style token seems corrupt`);

  const originMetadata = await getOriginMetadata(
    originNftContract,
    provenance.origin_token_id
  );
  if (!originMetadata) throw new Error(`couldnt get origin metadata`);
  const originFeatures = await extractOriginFeatures(
    provenance,
    originMetadata
  );
  const ret = {
    name: `Splice of ${originNftName} #${provenance.origin_token_id}`,
    description: `This Splice was created from ${originNftName} #${
      provenance.origin_token_id
    } using style "${style.getMetadata().name}".`,
    image: `${process.env.SERVER_BASE_URL}/splice/${styleCache.network}/${spliceTokenId}/image.png`,
    external_url: `${process.env.SPLICE_BASE_URL}/#/nft/${provenance.origin_collection}/${provenance.origin_token_id}`,
    properties: {
      style_name: style.getMetadata().name
    },
    splice: {
      colors: originFeatures.palette,
      randomness: originFeatures.randomness,
      origin_collection: provenance.origin_collection,
      origin_token_id: provenance.origin_token_id.toString(),
      style_collection: style.getCollectionAddress(),
      style_metadata_url: style.getMetadataUrl(),
      style_token_id: style.tokenId
    }
  };
  Cache.store(key, ret);

  return ret;
};

export default Metadata;
