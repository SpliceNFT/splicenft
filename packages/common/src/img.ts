import { NFTMetaData } from './types/NFT';

//const IPFS_GATEWAY = 'https://ipfs.io';
//const IPFS_GATEWAY = 'https://dweb.link';
const IPFS_GATEWAY = 'https://ipfs.getsplice.io';

const IPFS_LOCATION_REGEX = new RegExp(`/ipfs/(.+)`, 'gi');

export const resolveImage = (nftMetaData: NFTMetaData): string => {
  const imgUrl =
    nftMetaData.google_image || nftMetaData.image_url || nftMetaData.image;

  //console.log(imgUrl);
  return imgUrl ? ipfsGW(imgUrl) : '';
};

export const ipfsGW = (url: string) => {
  if (url.startsWith('ipfs://ipfs/'))
    return url.replace('ipfs://ipfs/', `${IPFS_GATEWAY}/ipfs/`);
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', `${IPFS_GATEWAY}/ipfs/`);
  } else {
    const i = url.indexOf('/ipfs/');
    if (i !== -1) {
      return `${IPFS_GATEWAY}${url.slice(i)}`;
    }
    return url;
  }
};

export const isIpfsGateway = (url: string): boolean => {
  return url.startsWith(IPFS_GATEWAY);
};

export const isIpfsLocation = (url: string): boolean => {
  return !!url.match(IPFS_LOCATION_REGEX);
};

export const getIpfsPath = (url: string): string => {
  if (!isIpfsLocation(url)) {
    throw new Error('not an ipfs path');
  }
  const matches = url.matchAll(IPFS_LOCATION_REGEX);
  return matches.next().value[1];
};
