import ImageToColors, { Color } from 'image-to-colors';
import { ImageLoader } from '../types/ImageLoader';

export const LoadImage: ImageLoader = async (
  image: string | HTMLImageElement,
  options: {
    proxy?: string;
  }
): Promise<Uint8Array> => {
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

  if (!pixels) return new Uint8Array();

  return Uint8Array.from(pixels.flatMap((p) => [...p, 255]));
};
