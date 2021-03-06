import { NFTPort, resolveImage } from '..';
import { NFTItemInTransit, NFTMetaData, NFTItem } from '../types/NFT';
import { NFTIndexer } from './NFTIndexer';

export class Fallback implements NFTIndexer {
  constructor(private primary: NFTPort, private fallback: NFTIndexer) {}

  public async getAllAssetsOfOwner(
    ownerAddress: string
  ): Promise<NFTItemInTransit[]> {
    const allAssets = await this.primary.getAllAssetsOfOwner(ownerAddress);
    return allAssets.map((nftportNftItem) => {
      if (!nftportNftItem.metadata) {
        return {
          ...nftportNftItem,
          metadata: new Promise<NFTMetaData | null>((resolve, reject) => {
            this.fallback
              .getAsset(
                nftportNftItem.contract_address,
                nftportNftItem.token_id
              )
              .then((nftItem) => resolve(nftItem?.metadata || null))
              .catch((a: any) => resolve(null));
          })
        };
      } else {
        return {
          ...nftportNftItem,
          name: nftportNftItem.name || nftportNftItem.metadata.name,
          google_image: nftportNftItem.cached_file_url
        };
      }
    });
  }

  canBeContinued(): boolean {
    return this.primary.canBeContinued();
  }
  reset(): void {
    if (this.canBeContinued()) {
      this.primary.reset();
    }
  }

  public async getAsset(collection: string, tokenId: string): Promise<NFTItem> {
    return this.fallback.getAsset(collection, tokenId);
  }
}
