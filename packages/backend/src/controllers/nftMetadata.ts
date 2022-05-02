import { Request, Response } from 'express';
import { fetchOriginMetadata } from '../lib/fetchOriginMetadata';

export const nftMetadata = async (req: Request, res: Response) => {
  const networkId = parseInt(req.params.network);
  const collection = req.params.collection;
  const token_id = req.params.token_id;
  const invalidate = req.headers['cache-control'] === 'must-revalidate';

  try {
    const metadata = await fetchOriginMetadata(
      networkId,
      collection,
      token_id,
      invalidate
    );
    res.status(200).send(metadata);
  } catch (e: any) {
    res.status(500).send(`couldn't load metadata :( ${e.message}`);
  }
};
