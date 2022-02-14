import { Img } from '@chakra-ui/react';
import { extractColors, isSVG, LoadImageBrowser } from '@splicenft/colors';
import { Transfer, Histogram, NFTItem } from '@splicenft/common';
import { isIpfsGateway } from '@splicenft/common/build/img';
import axios from 'axios';

/**
 * can be used to compute palette colors on the backend.
 */
export default async function getDominantColors(
  chainId: number | string,
  collection: string,
  tokenId: string
): Promise<Histogram> {
  const url = `${process.env.REACT_APP_VALIDATOR_BASEURL}/colors/${chainId}/${collection}/${tokenId}`;
  try {
    const { colors } = await (
      await axios.get<Transfer.ColorsResponse>(url)
    ).data;
    return colors;
  } catch (e: any) {
    throw new Error(`couldnt get image colors: ${e.message}`);
  }
}

export async function loadColors(
  nftItem: NFTItem,
  image: HTMLImageElement,
  chainId: number
): Promise<Histogram> {
  const dims = { w: image.width, h: image.height };
  if (
    dims.w * dims.h > 6_250_000 ||
    (!isSVG(image.src) && !isIpfsGateway(image.src))
  ) {
    console.log('image quite large or not on ipfs -> offloading to backend');
    return getDominantColors(
      chainId,
      nftItem.contract_address,
      nftItem.token_id
    );
  }

  try {
    return extractColors(image.src, LoadImageBrowser, { dims });
  } catch (e: any) {
    console.debug('palette extraction on frontend failed, trying the backend');
    return getDominantColors(
      chainId,
      nftItem.contract_address,
      nftItem.token_id
    );
  }
}
