import { NFTTrait } from '@splicenft/common';
import { Response } from 'express';
import { Readable } from 'stream';

export type IImageCallback = (
  err: any | null,
  readable: Readable | null,
  traits: NFTTrait[]
) => void;

const ImageCallback = (res: Response): IImageCallback => {
  return (
    err: any | null,
    readable: Readable | null,
    traits: NFTTrait[]
  ): void => {
    if (!readable || err) {
      console.error(err);
      return res.status(500).end();
    }

    res.set('Content-Type', 'image/png');
    res.status(200);
    console.debug('ImageCallback: piping buffer to res');
    readable.pipe(res);
  };
};

export default ImageCallback;
