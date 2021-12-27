import {
  ERC721,
  ipfsGW,
  NFTMetaData,
  ProvenanceOrigin,
  resolveImage,
  Splice
} from '@splicenft/common';
import axios from 'axios';
import { BigNumberish } from 'ethers';

import {
  LoadImageNode,
  extractColors,
  extractPaletteFromSvg,
  RGB
} from '@splicenft/colors';

export async function getOriginMetadata(
  erc721: ERC721,
  originTokenId: BigNumberish
): Promise<NFTMetaData | null> {
  const originMetadataUrl: string = ipfsGW(
    await erc721.tokenURI(originTokenId)
  );

  return (
    await axios.get<NFTMetaData>(originMetadataUrl, {
      responseType: 'json'
    })
  ).data;
}

export async function extractOriginFeatures(
  provenanceOrigin: ProvenanceOrigin,
  originMetadata: NFTMetaData
): Promise<{ palette: RGB[]; randomness: number }> {
  const originImageUrl = resolveImage(originMetadata);
  let palette: RGB[] = [];
  if (originImageUrl) {
    palette = await extractColors(originImageUrl, LoadImageNode, {});
  } else if (originMetadata.image_data) {
    //todo: this is not necessarily an svg ;)
    palette = extractPaletteFromSvg(originMetadata.image_data);
  }

  const randomness = Splice.computeRandomness(
    provenanceOrigin.collection,
    provenanceOrigin.token_id.toString()
  );

  return {
    palette,
    randomness
  };
}
