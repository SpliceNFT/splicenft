import axios from 'axios';
import { NFTItemInTransit, NFTMetaData } from '../types/NFT';

export interface NFTIndexer {
  getAllAssetsOfOwner(ownerAddress: string): Promise<NFTItemInTransit[]>;
  getAssetMetadata(
    collection: string,
    tokenId: string
  ): Promise<NFTMetaData | null>;
  // getNFTsOfOwner(
  //   collection: string,
  //   ownerAddress: string
  // ): Promise<Array<NFTItem | null>>;
}

export async function fetchMetadataFromUrl(
  tokenUrl: string,
  proxyAddress?: string
): Promise<NFTMetaData | null> {
  let metaData: NFTMetaData | null = null;
  try {
    const xres = await axios.get<NFTMetaData>(tokenUrl, {
      responseType: 'json'
    });
    if (xres.status === 500) throw new Error('server error');
    metaData = xres.data;
  } catch (e: any) {
    if (e.message === 'Network Error' && proxyAddress) {
      const res = await axios.get<NFTMetaData>(proxyAddress, {
        params: {
          url: tokenUrl
        },
        responseType: 'json'
      });
      metaData = res.data;
    }
  }
  return metaData;
}
