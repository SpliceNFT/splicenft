import {
  ERC721,
  getIpfsPath,
  ipfsGW,
  isIpfsLocation,
  NFTMetaData
} from '@splicenft/common';
import axios from 'axios';
import { BigNumberish } from 'ethers';
import { pingPublicGateway } from './ipfs';

const B64_DATA_PREFIX = 'data:application/json;base64,';

export async function getOriginMetadata(
  erc721: ERC721,
  originTokenId: BigNumberish
): Promise<NFTMetaData> {
  const originMetadataUrl: string = ipfsGW(
    await erc721.tokenURI(originTokenId)
  );

  if (originMetadataUrl.startsWith(B64_DATA_PREFIX)) {
    const b64s = originMetadataUrl.replace(B64_DATA_PREFIX, '');
    const buff = Buffer.from(b64s, 'base64');
    const text = buff.toString('utf-8');
    return JSON.parse(text);
  }

  let prefetchTimeout;
  if (isIpfsLocation(originMetadataUrl)) {
    prefetchTimeout = setTimeout(() => {
      pingPublicGateway(getIpfsPath(originMetadataUrl));
    }, 10000);
  }

  const metadata = (
    await axios.get<NFTMetaData>(originMetadataUrl, {
      responseType: 'json',
      timeout: 60 * 1000
    })
  ).data;

  if (prefetchTimeout) {
    clearTimeout(prefetchTimeout);
  }
  if (!metadata)
    throw new Error(`can't read metadata ${erc721.address}/${originTokenId}`);

  return metadata;
}
