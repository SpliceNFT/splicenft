import palette, { RGB } from 'get-rgba-palette';
import ImageToColors, { Color } from 'image-to-colors';
import { NFTMetaData } from './types/NFT';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export const resolveImage = (nftMetaData: NFTMetaData): string => {
  const imgUrl = nftMetaData.image ? nftMetaData.image : nftMetaData.image_url;
  return ipfsGW(imgUrl || '');
};

export const ipfsGW = (url: string) => {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', IPFS_GATEWAY);
  } else {
    return url;
  }
};

export const extractColors = async (
  imageUrl: string,
  options: {
    proxy?: string;
  }
): Promise<RGB[]> => {
  let pixels: Color[] = [];
  try {
    pixels = await ImageToColors.getFromExternalSource(imageUrl, {
      setImageCrossOriginToAnonymous: true
    });
  } catch (e: unknown) {
    if (options.proxy) {
      pixels = await ImageToColors.getFromExternalSource(
        `${process.env.REACT_APP_CORS_PROXY}?url=${imageUrl}`,
        {
          setImageCrossOriginToAnonymous: true
        }
      );
    }
  }

  if (!pixels) return [];
  const flatPixels = pixels.flatMap((p) => [...p, 255]);

  const colors = palette(flatPixels, 10);
  return colors;
};
