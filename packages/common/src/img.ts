import { NFTMetaData } from './types/NFT';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const resolveImage = (nftMetaData: NFTMetaData): string => {
  const imgUrl = nftMetaData.image ? nftMetaData.image : nftMetaData.image_url;
  if (imgUrl?.startsWith('ipfs://')) {
    return imgUrl.replace('ipfs://', IPFS_GATEWAY);
  } else {
    return imgUrl || '';
  }
};

export default resolveImage;
