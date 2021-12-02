import {
  ERC721,
  extractPalette,
  ipfsGW,
  NFTMetaData,
  resolveImage,
  RGB,
  Splice,
  TokenProvenance
} from '@splicenft/common';
import { extractPaletteFromSvg } from '@splicenft/common/build/img';
import axios from 'axios';
import { ethers } from 'ethers';
import FileType from 'file-type';
import { GetPixels } from './GetPixels';

export async function extractOriginImage(originImageUrl: string) {
  const axiosResponse = await axios.get(originImageUrl, {
    responseType: 'arraybuffer'
  });

  const originalImageData: Buffer = await axiosResponse.data;

  const filetype = await FileType.fromBuffer(originalImageData);
  if (!filetype) throw new Error("can't read original nft file");

  return GetPixels(filetype.mime, originalImageData);
}

export async function getOriginMetadata(
  erc721: ERC721,
  originTokenId: ethers.BigNumber | number
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
  provenance: TokenProvenance,
  originMetadata: NFTMetaData
): Promise<{ palette: RGB[]; randomness: number }> {
  const originImageUrl = resolveImage(originMetadata);
  let palette: RGB[] = [];
  if (originImageUrl) {
    const originPixels = await extractOriginImage(originImageUrl);
    palette = extractPalette(new Uint8Array(originPixels));
  } else if (originMetadata.image_data) {
    //todo: this is not necessarily an svg ;)
    palette = extractPaletteFromSvg(originMetadata.image_data);
  }

  const randomness = Splice.computeRandomness(
    provenance.origin_collection,
    provenance.origin_token_id.toString()
  );

  return {
    palette,
    randomness
  };
}
