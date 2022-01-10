import axios from 'axios';
import { NFTItem, NFTItemInTransit, NFTMetaData } from '../types/NFT';
import { NFTIndexer } from './NFTIndexer';

export class Backend implements NFTIndexer {
  private validatorBaseUrl: string;

  constructor(validatorBaseUrl: string) {
    this.validatorBaseUrl = validatorBaseUrl;
  }
  canBeContinued(): boolean {
    return false;
  }
  reset() {
    return;
  }

  public async getAllAssetsOfOwner(
    ownerAddress: string
  ): Promise<NFTItemInTransit[]> {
    throw new Error('this indexer cant get an owners assets');
  }

  public async getAsset(collection: string, tokenId: string): Promise<NFTItem> {
    const metadataUrl = `${this.validatorBaseUrl}/nft/1/${collection}/${tokenId}`;

    const xres = await axios.get<NFTMetaData>(metadataUrl, {
      responseType: 'json'
    });
    if (xres.status === 500) throw new Error('metadata server: server error');
    const metadata = xres.data;

    return {
      contract_address: collection,
      token_id: tokenId,
      name: metadata.name,
      description: metadata.description,
      metadata
    };
  }
}
