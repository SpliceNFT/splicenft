import { extractColors, LoadImageNode, RGB } from '@splicenft/colors';
import {
  ERC721,
  ipfsGW,
  NFTMetaData,
  ProvenanceOrigin,
  resolveImage,
  rgbHex,
  Splice,
  Transfer
} from '@splicenft/common';
import axios from 'axios';
import { BigNumberish } from 'ethers';

export async function getOriginMetadata(
  erc721: ERC721,
  originTokenId: BigNumberish
): Promise<NFTMetaData | null> {
  const originMetadataUrl: string = ipfsGW(
    await erc721.tokenURI(originTokenId)
  );
  console.log(originMetadataUrl);
  const metadata = (
    await axios.get<NFTMetaData>(originMetadataUrl, {
      responseType: 'json'
    })
  ).data;

  return metadata;
}

export async function extractOriginFeatures(
  provenanceOrigin: ProvenanceOrigin,
  originMetadata: NFTMetaData
): Promise<Transfer.OriginFeatures> {
  const originImageUrl =
    resolveImage(originMetadata) || originMetadata.image_data;
  let palette: RGB[] = [];
  if (originImageUrl) {
    palette = await extractColors(originImageUrl, LoadImageNode, {});
  }

  const randomness = Splice.computeRandomness(
    provenanceOrigin.collection,
    provenanceOrigin.token_id.toString()
  );
  const ret: Transfer.OriginFeatures = {
    colors: palette.map((c: RGB) => ({
      rgb: c,
      hex: rgbHex(c[0], c[1], c[2])
    })),
    randomness
  };

  return ret;
}
