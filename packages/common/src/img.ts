import { NFTMetaData } from './types/NFT';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export const resolveImage = (nftMetaData: NFTMetaData): string => {
  const imgUrl = nftMetaData.image ? nftMetaData.image : nftMetaData.image_url;
  return ipfsGW(imgUrl || '');
};

export const ipfsGW = (url: string) => {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', IPFS_GATEWAY);
  } else {
    return url;
  }
};
