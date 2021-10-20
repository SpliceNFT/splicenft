import { NFTMetaData } from '..';
import { NFTItem } from '../types/NFT';

export interface NFTIndexer {
  getAllAssetsOfOwner(ownerAddress: string): Promise<NFTItem[]>;
  getAssetMetadata(
    collection: string,
    tokenId: string
  ): Promise<NFTMetaData | null>;
  // getNFTsOfOwner(
  //   collection: string,
  //   ownerAddress: string
  // ): Promise<Array<NFTItem | null>>;
}
