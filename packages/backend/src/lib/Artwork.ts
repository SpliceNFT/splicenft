import {
  ERC721ABI,
  ipfsGW,
  NFTMetaData,
  resolveImage,
  Splice
} from '@splicenft/common';
import { extractPalette } from '@splicenft/common/build/img';
import axios from 'axios';
import { ethers } from 'ethers';
import FileType from 'file-type';
import { GetPixels } from './GetPixels';
import Render from './render';
import { getSplice } from './SpliceContracts';
import { StyleMetadataCache } from './StyleCache';
import * as Cache from './Cache';
import { Readable } from 'stream';

async function extractOriginImage(originImageUrl: string) {
  const axiosResponse = await axios.get(originImageUrl, {
    responseType: 'arraybuffer'
  });

  const originalImageData: Buffer = await axiosResponse.data;

  const filetype = await FileType.fromBuffer(originalImageData);
  if (!filetype) throw new Error("can't read original nft file");

  return GetPixels(filetype.mime, originalImageData);
}

export default async function Artwork(
  styleCache: StyleMetadataCache,
  tokenId: number,
  callback: (err: any | null, stream: Readable) => unknown
) {
  const key = `${styleCache.network}/splice/images/${tokenId}.png`;

  const stream = await Cache.lookupBinary(key);
  if (stream) {
    return callback(null, stream);
  }

  const splice = getSplice(styleCache.network);
  const { provider } = splice.providerOrSigner;

  const heritage = await splice.getHeritage(tokenId);
  if (!heritage) throw new Error(`no heritage for token ${tokenId}`);

  const style = styleCache.getStyle(heritage.style_token_id.toString());
  if (!style) throw new Error(`style token seems corrupt`);

  const erc721 = new ethers.Contract(
    heritage.origin_collection,
    ERC721ABI,
    provider
  );

  const originMetadataUrl: string = ipfsGW(
    await erc721.tokenURI(heritage.origin_token_id)
  );

  const originMetadata = await (
    await axios.get<NFTMetaData>(originMetadataUrl, {
      responseType: 'json'
    })
  ).data;

  const originPixels = await extractOriginImage(resolveImage(originMetadata));
  const palette = extractPalette(new Uint8Array(originPixels));

  const randomness = Splice.computeRandomness(
    heritage.origin_collection,
    heritage.origin_token_id.toNumber()
  );

  const renderer = await style.getRenderer();

  Render(
    renderer,
    {
      colors: palette,
      dim: { w: 1500, h: 500 },
      randomness
    },
    (err: any | null, buffer: Buffer) => {
      if (!err) {
        Cache.store(key, buffer);
      }
      callback(err, Readable.from(buffer));
    }
  );
}
