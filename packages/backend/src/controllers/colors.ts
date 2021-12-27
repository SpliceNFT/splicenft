import {
  extractColors as _extractColors,
  LoadImageNode
} from '@splicenft/colors';
import { erc721, resolveImage, rgbHex } from '@splicenft/common';
import { Request, Response } from 'express';
import { getOriginMetadata } from '../lib/Origin';
import { providerFor } from '../lib/SpliceContracts';

export async function extractColors(req: Request, res: Response) {
  const networkId = parseInt(req.params.network);
  const collection = req.params.collection;
  const tokenId = req.params.tokenid;

  try {
    const provider = providerFor(networkId);
    if (!provider)
      throw new Error(`Splice is not available for network ${networkId}`);

    const contract = erc721(provider, collection);
    const metadata = await getOriginMetadata(contract, tokenId);
    if (!metadata)
      throw new Error(`can't read metadata for ${tokenId} on ${collection}`);

    const image = resolveImage(metadata);
    const colors = await _extractColors(image, LoadImageNode, {});
    res.status(200).json({
      colors: colors.map((c) => ({
        rgb: c,
        hex: rgbHex(c[0], c[1], c[2])
      }))
    });
  } catch (e: any) {
    console.error(`couldnt create image :( ${e.message}`);
    res.status(500).send(`couldnt create image :( ${e.message}`);
  }
}
