import palette, { RGB } from 'get-rgba-palette';
import ImageToColors, { Color } from 'image-to-colors';
import { NFTMetaData } from './types/NFT';

//const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const IPFS_GATEWAY = 'https://dweb.link/ipfs/';

export const resolveImage = (nftMetaData: NFTMetaData): string => {
  const imgUrl = nftMetaData.image ? nftMetaData.image : nftMetaData.image_url;
  return imgUrl ? ipfsGW(imgUrl) : '';
};

export const ipfsGW = (url: string) => {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', IPFS_GATEWAY);
  } else {
    return url;
  }
};

export const extractPalette = (flatPixels: number[] | Uint8Array): RGB[] => {
  return palette(flatPixels, 10);
};

//only in browsers.
export const extractPixels = async (
  image: string | HTMLImageElement,
  options: {
    proxy?: string;
  }
): Promise<number[]> => {
  let pixels: Color[] = [];

  if (typeof image === 'string') {
    try {
      pixels = await ImageToColors.getFromExternalSource(image, {
        setImageCrossOriginToAnonymous: true
      });
    } catch (e: unknown) {
      console.error(e);
      if (options.proxy && typeof image === 'string') {
        pixels = await ImageToColors.getFromExternalSource(
          `${process.env.REACT_APP_CORS_PROXY}?url=${image}`,
          {
            setImageCrossOriginToAnonymous: true
          }
        );
      }
    }
  } else {
    image.crossOrigin = 'anonymous';
    console.log('getting colors from loaded image');
    pixels = ImageToColors.get(image, {
      setImageCrossOriginToAnonymous: true
    });
  }

  if (!pixels) return [];
  return pixels.flatMap((p) => [...p, 255]);
};

export const extractColors = async (
  image: string | HTMLImageElement,
  options: {
    proxy?: string;
  }
): Promise<RGB[]> => {
  const px = await extractPixels(image, options);
  return extractPalette(px);
};
