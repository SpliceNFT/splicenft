import { NFTTrait } from "./NFT";

export type NFTMetaData = {
  attributes?: NFTTrait;
  name: string;
  description: string;
  image: string;
  external_url: null | string;
  google_image?: string;
  ipfs_image?: string;
  points?: Record<string, string | number>;
};

export type NFTItem = {
  contract_address: string;
  token_id: string;
  token_uri: string;
  metadata: NFTMetaData;
  asset_metadata: {
    height: number;
    width: number;
    file_size: number;
  };
  image_url: string;
  cached_image_url: string;
  mint_date: string | null;
};

export type NftPortNFTResponse = {
  response: string;
  error: any | null;
  nft: NFTItem;
};
