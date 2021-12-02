import palette, { RGB } from 'get-rgba-palette';
import { default as hexRgb } from 'hex-rgb';
import ImageToColors, { Color } from 'image-to-colors';
import { NFTMetaData } from './types/NFT';

//const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const IPFS_GATEWAY = 'https://dweb.link/ipfs/';
const SVG_DATA_PREFIX = 'data:image/svg';
const SVG_FILL_REGEX = new RegExp(
  `fill\s*[:=]\s*['"](\#[A-Fa-f0-9]{6})['"]`,
  'gi'
);

export const resolveImage = (nftMetaData: NFTMetaData): string => {
  const imgUrl =
    nftMetaData.google_image || nftMetaData.image_url || nftMetaData.image;

  //console.log(imgUrl);
  return imgUrl ? ipfsGW(imgUrl) : '';
};

export const ipfsGW = (url: string) => {
  if (url.startsWith('ipfs://ipfs/'))
    return url.replace('ipfs://ipfs/', IPFS_GATEWAY);
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', IPFS_GATEWAY);
  } else {
    return url;
  }
};

export const extractPalette = (flatPixels: number[] | Uint8Array): RGB[] => {
  return palette(flatPixels, 10);
};

export const extractPaletteFromSvg = (svg: string): RGB[] => {
  const matches = svg.matchAll(SVG_FILL_REGEX);
  console.log(matches);
  const ret: Record<string, number> = {};
  for (const match of matches) {
    if (ret[match[1]]) {
      ret[match[1]] = ret[match[1]] + 1;
    } else {
      ret[match[1]] = 1;
    }
  }
  return Object.keys(ret)
    .sort(function (a, b) {
      return ret[b] - ret[a];
    })
    .slice(0, 10)
    .map((hx): RGB => hexRgb(hx, { format: 'array' }).slice(0, 3) as RGB);
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
    } catch (e: any) {
      console.debug(
        "couldn't load image from external source, trying again with proxy"
      );
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
  if (
    (typeof image === 'string' && image.startsWith(SVG_DATA_PREFIX)) ||
    (typeof image === 'object' && image.src.startsWith(SVG_DATA_PREFIX))
  ) {
    console.warn('an SVG image !!!');
    const dataUrl = decodeURIComponent(
      typeof image === 'string' ? image : image.src
    );
    return extractPaletteFromSvg(dataUrl);
  } else {
    const px = await extractPixels(image, options);
    return extractPalette(px);
  }
};
