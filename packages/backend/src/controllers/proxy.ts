import { Request, Response } from 'express';
import httpProxy from 'http-proxy-stream';

export function proxy() {
  return async (req: Request, res: Response) => {
    const url = req.query.url;
    httpProxy(
      req,
      {
        url
      },
      res
    );
  };
}
