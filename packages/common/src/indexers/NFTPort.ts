import axios from 'axios';
import { ChainOpt } from '../types/Chains';
import { NFTItem, NFTMetaData, NFTPortNFTItem } from '../types/NFT';
import { NFTIndexer } from '../types/NFTIndexer';

type NftPortAccountResponse = {
  response: string;
  error: unknown | null;
  nfts: NFTPortNFTItem[];
  total: number;
};

type NftPortNftMetadataResponse = {
  error: unknown | null;
  nft: NFTItem & {
    asset_metadata: {
      height: number;
      width: number;
      file_size: number;
    };
    image_url: string;
    cached_image_url: string;
    mint_date: null;
  };
};

const BASE_URI = `https://api.nftport.xyz/v0`;

export class NFTPort implements NFTIndexer {
  private chain: string;

  private nftPortAuth: string;

  constructor(chain: ChainOpt, auth: string) {
    if (chain !== 'ethereum')
      throw 'only ethereum mainnet is supported by NFTPort atm.';
    this.chain = chain;
    this.nftPortAuth = auth;
  }

  public async getAllAssetsOfOwner(
    ownerAddress: string
  ): Promise<NFTPortNFTItem[]> {
    const url = `${BASE_URI}/accounts/${ownerAddress}`;
    const _resp = await axios.get<NftPortAccountResponse>(url, {
      params: {
        chain: this.chain,
        include: 'metadata'
      },
      headers: {
        Authorization: this.nftPortAuth
      }
    });

    return _resp.data.nfts;
  }

  public async getAssetMetadata(
    collection: string,
    tokenId: string
  ): Promise<NFTMetaData | null> {
    const url = `${BASE_URI}/nfts/${collection}/${tokenId}`;
    const _resp = await axios.get<NftPortNftMetadataResponse>(url, {
      params: {
        chain: this.chain
      },
      headers: {
        Authorization: this.nftPortAuth
      }
    });
    return _resp.data.nft.metadata;
  }
}

/**
 * https://docs.nftport.xyz/docs/nftport/b3A6MTc0MDA0NDI-return-nf-ts-owned-by-account
 */
