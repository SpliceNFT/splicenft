import { extractColors, Histogram, LoadImageNode } from '@splicenft/colors';
import {
  getIpfsPath,
  isIpfsLocation,
  NFTMetaData,
  ProvenanceOrigin,
  resolveImage,
  Splice,
  Transfer
} from '@splicenft/common';
import { pingPublicGateway } from './ipfs';

export async function extractOriginFeatures(
  provenanceOrigin: ProvenanceOrigin,
  originMetadata: NFTMetaData
): Promise<Transfer.OriginFeatures> {
  const originImageUrl =
    resolveImage(originMetadata) || originMetadata.image_data;
  let colors: Histogram = [];
  if (originImageUrl) {
    let prefetchTimeout;
    if (isIpfsLocation(originImageUrl)) {
      prefetchTimeout = setTimeout(() => {
        pingPublicGateway(getIpfsPath(originImageUrl));
      }, 10000);
    }

    colors = await extractColors(originImageUrl, LoadImageNode, {});
    if (prefetchTimeout) {
      clearTimeout(prefetchTimeout);
    }
  }

  const randomness = Splice.computeRandomness(
    provenanceOrigin.collection,
    provenanceOrigin.token_id.toString()
  );
  const ret: Transfer.OriginFeatures = {
    colors,
    randomness
  };

  return ret;
}
