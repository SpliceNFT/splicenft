import {
  Splice,
  ERC721ABI,
  ipfsGW,
  NFTMetaData,
  resolveImage
} from '@splicenft/common';
import { GetPixels } from './GetPixels';
import FileType from 'file-type';

import axios from 'axios';
import { ethers, providers } from 'ethers';
import { StyleMetadataCache } from './StyleCache';
import { extractPalette } from '@splicenft/common/build/img';
import Render from './render';

async function extractOriginImage(metadata: NFTMetaData) {
  const originImageUrl = resolveImage(metadata);
  const axiosResponse = await axios.get(originImageUrl, {
    responseType: 'arraybuffer'
  });

  const originalImageData: Buffer = await axiosResponse.data;

  const filetype = await FileType.fromBuffer(originalImageData);
  if (!filetype) throw "can't read original nft file";

  return GetPixels(filetype.mime, originalImageData);
}

export default async function Artwork(
  provider: providers.Provider,
  styleCache: StyleMetadataCache,
  splice: Splice,
  tokenId: number,
  callback: (err: any | null, buffer: Buffer) => unknown
) {
  const heritage = await splice.getHeritage(tokenId);
  if (!heritage) throw `no heritage for token ${tokenId}`;

  const style = styleCache.getStyle(heritage.style_token_id.toNumber());
  if (!style) throw `style token seems corrupt`;

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

  const originPixels = await extractOriginImage(originMetadata);
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
    callback
  );
}
