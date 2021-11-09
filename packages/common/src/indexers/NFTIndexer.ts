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
