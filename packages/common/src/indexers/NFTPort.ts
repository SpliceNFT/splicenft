import axios from 'axios';
import { ChainOpt } from '../types/Chains';
import { NFTItem, NFTMetaData, NFTPortNFTItem } from '../types/NFT';
import { NFTIndexer } from './NFTIndexer';

type NftPortAccountResponse = {
  response: string;
  error: unknown | null;
  nfts: NFTPortNFTItem[];
  total: number | null;
  continuation: string | null;
};

type NftPortNftMetadataResponse = {
  error: unknown | null;
  response: string;
  status: string;
  status_message: string;
  nft: NFTItem & {
    updated_date: string;
    asset_metadata: {
      height: number;
      width: number;
      file_size: number;
    };
    image_url: string;
    cached_image_url: string;
    mint_date: null;
  };
  contract?: {
    name: string;
    symbol: string;
    type: 'ERC721' | 'ERC1155';
  };
};

const BASE_URI = `https://api.nftport.xyz/v0`;

export class NFTPort implements NFTIndexer {
  private chain: string;

  private nftPortAuth: string;

  //todo: this is architecturally bad
  private currentContinuation: string | unknown;
  private previousAddress: string | undefined;

  constructor(chain: ChainOpt, auth: string) {
    if (chain !== 'ethereum')
      throw 'only ethereum mainnet is supported by NFTPort atm.';
    this.chain = chain;
    this.nftPortAuth = auth;
  }
  canBeContinued(): boolean {
    return !!this.currentContinuation;
  }

  reset(): void {
    if (this.canBeContinued()) {
      this.previousAddress = undefined;
      this.currentContinuation = undefined;
    }
  }

  public async getAllAssetsOfOwner(
    ownerAddress: string
  ): Promise<NFTPortNFTItem[]> {
    if (ownerAddress !== this.previousAddress) {
      this.currentContinuation = null;
    }
    const url = `${BASE_URI}/accounts/${ownerAddress}`;
    const _resp = await axios.get<NftPortAccountResponse>(url, {
      params: {
        chain: this.chain,
        include: 'metadata',
        continuation: this.currentContinuation
      },
      headers: {
        Authorization: this.nftPortAuth
      }
    });
    this.currentContinuation = _resp.data.continuation;
    this.previousAddress = ownerAddress;

    return _resp.data.nfts;
  }

  public async getAsset(
    collection: string,
    tokenId: string
  ): Promise<NFTItem | null> {
    const url = `${BASE_URI}/nfts/${collection}/${tokenId}`;
    const _resp = await axios.get<NftPortNftMetadataResponse>(url, {
      params: {
        chain: this.chain
      },
      headers: {
        Authorization: this.nftPortAuth
      }
    });
    if (_resp.data.error) {
      throw new Error(_resp.data.status_message);
    } else {
      return _resp.data.nft;
    }
  }
}

/**
 * https://docs.nftport.xyz/docs/nftport/b3A6MTc0MDA0NDI-return-nf-ts-owned-by-account
 */
