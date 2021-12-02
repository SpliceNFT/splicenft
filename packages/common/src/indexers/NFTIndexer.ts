import axios from 'axios';
import { NFTItemInTransit, NFTItem, NFTMetaData } from '../types/NFT';

export abstract class NFTIndexer {
  abstract getAllAssetsOfOwner(
    ownerAddress: string
  ): Promise<NFTItemInTransit[]>;
  abstract getAsset(
    collection: string,
    tokenId: string
  ): Promise<NFTItem | null>;
  abstract reset(): void;
  abstract canBeContinued(): boolean;
  // getNFTsOfOwner(
  //   collection: string,
  //   ownerAddress: string
  // ): Promise<Array<NFTItem | null>>;
}

export async function fetchMetadataFromUrl(
  tokenUrl: string,
  proxyAddress?: string
): Promise<NFTMetaData> {
  try {
    const xres = await axios.get<NFTMetaData>(tokenUrl, {
      responseType: 'json'
    });
    if (xres.status === 500) throw new Error('metadata server: server error');
    return xres.data;
  } catch (e: any) {
    if (e.message === 'Network Error' && proxyAddress) {
      const res = await axios.get<NFTMetaData>(proxyAddress, {
        params: {
          url: tokenUrl
        },
        responseType: 'json'
      });
      return res.data;
    }

    throw new Error('couldnt load metadata from url ');
  }
}
