import { PNG } from 'pngjs';
import JPEG from 'jpeg-js';
import { GifReader } from 'omggif';
import axios from 'axios';
import FileType, { FileTypeResult } from 'file-type';
import { ImageLoader, ImageLoaderResult } from '../types/ImageLoader';
import sizeOf from 'image-size';
import fs from 'fs';

/**
 * a much simpler version of https://github.com/scijs/get-pixels
 */

async function handlePNG(data: Buffer): Promise<Buffer> {
  const png = new PNG();
  return new Promise((resolve, reject) => {
    png.parse(data, (err, img_data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(img_data.data);
    });
  });
}

async function handleJPEG(data: Buffer): Promise<Buffer> {
  return Promise.resolve(JPEG.decode(data).data);
}

async function handleGIF(data: Buffer): Promise<Buffer> {
  const reader = new GifReader(data);
  const ret = new Uint8Array(reader.height * reader.width * 4);

  reader.decodeAndBlitFrameRGBA(0, ret);
  return Promise.resolve(Buffer.from(ret));
}

export async function readImage(
  mimeType: string,
  data: Buffer
): Promise<Buffer> {
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
  const size = sizeOf(originalImageData);
  if (!size.width || !size.height) {
    throw new Error(`couldn't read image size of ${image}`);
  }

  return {
    dims: { w: size.width, h: size.height },
    rgb: await readImage(filetype.mime, originalImageData)
  };
};
