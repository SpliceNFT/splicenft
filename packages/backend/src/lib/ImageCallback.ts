import { Response } from 'express';
import { Readable } from 'stream';

const ImageCallback = (res: Response) => {
  return (err: any | null, readable: Readable) => {
    if (err) {
      console.error(err);
      return res.status(500).end();
    }

    res.set('Content-Type', 'image/png');
    res.status(200);
    readable.pipe(res);
  };
};

export default ImageCallback;
