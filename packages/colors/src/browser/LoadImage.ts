import ImageToColors from 'image-to-colors';
import { ImageLoader, ImageLoaderResult } from '../types/ImageLoader';
import sizeOf from 'image-size';
import { RGB } from '../types/RGB';

export const LoadImage: ImageLoader = async (
  image: string | HTMLImageElement,
  options: {
    proxy?: string;
  }
): Promise<ImageLoaderResult> => {
  let pixels: RGB[] = [];
  let dims: { w: number; h: number } | undefined = undefined;

  if (typeof image === 'string') {
    try {
      pixels = await ImageToColors.getFromExternalSource(image, {
        setImageCrossOriginToAnonymous: true
      });
      const sz = sizeOf(image);
      if (sz.width && sz.height) {
        dims = { w: sz.width, h: sz.height };
      }
    } catch (e: any) {
      console.debug(
        "couldn't load image from external source, trying again with proxy"
      );
      if (options.proxy) {
        const proxyUrl = `${process.env.REACT_APP_CORS_PROXY}?url=${image}`;
        return LoadImage(proxyUrl, {});
      }
    }
  } else {
    image.crossOrigin = 'anonymous';
    pixels = ImageToColors.get(image, {
      setImageCrossOriginToAnonymous: true
    });
    dims = { w: image.width, h: image.height };
  }

  if (!pixels) throw new Error('couldnt load image');
  if (!dims) throw new Error('couldnt load image size');

  return {
    rgb: Uint8Array.from(pixels.flatMap((p) => [...p, 255])),
    dims
  };
};
