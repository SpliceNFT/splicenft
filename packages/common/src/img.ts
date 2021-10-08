import { NFTMetaData } from './types/NFTPort';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const resolveImage = (
  nftMetaData: NFTMetaData | null | undefined
): string | undefined => {
  if (!nftMetaData) return;
  const imgUrl = nftMetaData.image ? nftMetaData.image : nftMetaData.image_url;
  if (imgUrl?.startsWith('ipfs://')) {
    return imgUrl.replace('ipfs://', IPFS_GATEWAY);
  } else {
    return imgUrl;
  }
};

export default resolveImage;
