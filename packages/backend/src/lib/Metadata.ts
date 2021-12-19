import { BigNumber } from '.pnpm/@ethersproject+bignumber@5.4.2/node_modules/@ethersproject/bignumber';
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
  const provenance = await splice.getProvenance(BigNumber.from(spliceTokenId));
  if (!provenance) {
    throw new Error(`no provenance for token ${spliceTokenId}`);
  }

  const style = styleCache.getStyle(provenance.style_token_id);
  if (!style) throw new Error(`style token seems corrupt`);

  const firstOrigin = provenance.origins[0];
  if (!firstOrigin) throw new Error(`no origin for splice`);

  const originNftContract = splice.getOriginNftContract(firstOrigin.collection);
  const originNftName = await originNftContract.name();

  const originMetadata = await getOriginMetadata(
    originNftContract,
    firstOrigin.token_id
  );

  if (!originMetadata) throw new Error(`couldnt get origin metadata`);
  const originFeatures = await extractOriginFeatures(
    firstOrigin,
    originMetadata
  );

  const ret = {
    name: `Splice of ${originNftName} #${firstOrigin.token_id}`,
    description: `This Splice was created from ${originNftName} #${
      firstOrigin.token_id
    } using style "${style.getMetadata().name}".`,
    image: `${process.env.SERVER_BASE_URL}/splice/${styleCache.network}/${spliceTokenId}/image.png`,
    external_url: `${process.env.SPLICE_BASE_URL}/#/nft/${firstOrigin.collection}/${firstOrigin.token_id}`,
    properties: {
      style_name: style.getMetadata().name
    },
    splice: {
      colors: originFeatures.palette,
      randomness: originFeatures.randomness,
      origins: provenance.origins.map((o) => ({
        ...o,
        token_id: o.token_id.toString()
      })),
      style_collection: style.getCollectionAddress(),
      style_metadata_url: style.getMetadataUrl(),
      style_token_id: style.tokenId
    }
  };
  Cache.store(key, ret);

  return ret;
};

export default Metadata;
