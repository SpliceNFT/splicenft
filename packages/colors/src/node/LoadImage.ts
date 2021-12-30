import { PNG } from 'pngjs';
import JPEG from 'jpeg-js';
import { GifReader } from 'omggif';
import axios from 'axios';
import FileType, { FileTypeResult } from 'file-type';
import { ImageLoader, ImageLoaderResult } from '../types/ImageLoader';
import fs from 'fs';

/**
 * a much simpler version of https://github.com/scijs/get-pixels
 */

type HandlerRetval = {
  dims: { w: number; h: number };
  rgb: Buffer;
};

async function handlePNG(data: Buffer): Promise<HandlerRetval> {
  const png = new PNG();
  return new Promise((resolve, reject) => {
    png.parse(data, (err, img_data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        dims: { w: img_data.width, h: img_data.height },
        rgb: img_data.data
      });
    });
  });
}

async function handleJPEG(data: Buffer): Promise<HandlerRetval> {
  const decoded = JPEG.decode(data, {
    maxMemoryUsageInMB: 2048
  });

  return Promise.resolve({
    dims: { w: decoded.width, h: decoded.height },
    rgb: decoded.data
  });
}

async function handleGIF(data: Buffer): Promise<HandlerRetval> {
  const reader = new GifReader(data);
  const ret = new Uint8Array(reader.height * reader.width * 4);

  reader.decodeAndBlitFrameRGBA(0, ret);
  return Promise.resolve({
    dims: { w: reader.width, h: reader.height },
    rgb: Buffer.from(ret)
  });
}

export async function readImage(
  mimeType: string,
  data: Buffer
): Promise<HandlerRetval> {
  switch (mimeType) {
    case 'image/png':
      return handlePNG(data);

    case 'image/jpg':
    case 'image/jpeg':
      return handleJPEG(data);

    case 'image/gif':
      return handleGIF(data);

    default:
      throw new Error('Unsupported file type: ' + mimeType);
  }
}
export const getFileType = async (
  originalImageData: Buffer
): Promise<FileTypeResult> => {
  const filetype = await FileType.fromBuffer(originalImageData);
  if (!filetype) throw new Error("can't read original file");
  return filetype;
};

export const LoadImage: ImageLoader = async (
  image: string | HTMLImageElement,
  options: {
    proxy?: string;
  }
): Promise<ImageLoaderResult> => {
  if ('object' === typeof image) {
    throw new Error('doesnt work in node environments');
  }
  let originalImageData: Buffer | undefined = undefined;

  if (fs.existsSync(image)) {
    originalImageData = await fs.promises.readFile(image);
  } else {
    const axiosResponse = await axios.get<Buffer>(image, {
      responseType: 'arraybuffer'
    });
    originalImageData = await axiosResponse.data;
  }

  if (!originalImageData) {
    throw new Error('couldnt read image data');
  }

  const filetype = await getFileType(originalImageData);

  return readImage(filetype.mime, originalImageData);
};
