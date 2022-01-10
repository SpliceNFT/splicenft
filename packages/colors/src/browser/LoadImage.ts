import ImageToColors from 'image-to-colors';
import {
  ImageLoader,
  ImageLoaderOptions,
  ImageLoaderResult
} from '../types/ImageLoader';
import { RGB } from '../types/RGB';

//todo: consider using https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
export const LoadImage: ImageLoader = async (
  image: string | HTMLImageElement,
  options: ImageLoaderOptions
): Promise<ImageLoaderResult> => {
  let pixels: RGB[] = [];
  let dims = options.dims;

  if (typeof image === 'string') {
    try {
      if (!options.dims) {
        throw new Error(
          'must provide dimensions when loading an image from an URL'
        );
      }
      pixels = await ImageToColors.getFromExternalSource(image, {
        setImageCrossOriginToAnonymous: true
      });
    } catch (e: any) {
      console.debug(
        "LoadImage: couldn't load image from external source, retrying with proxy"
      );
      if (options.proxy) {
        return LoadImage(`${options.proxy}?url=${image}`, { dims });
      }
    }
  } else {
    image.crossOrigin = 'anonymous';
    console.debug('getting image data from cors source');
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
