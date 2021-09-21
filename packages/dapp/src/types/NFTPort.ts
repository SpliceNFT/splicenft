export type NFTTrait = {
  trait_type: string;
  value: string;
};
export type NFTMetaData = {
  description: string;
  external_url: null | string;
  image: string;
  name: string;
  attributes?: NFTTrait;
  google_image?: string;
  ipfs_image?: string;
  points?: Record<string, string | number>;
  animation_url?: string;
};

export type NFTItem = {
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  asset_url: string;
  metadata: NFTMetaData;
};

export type NftPortAccountResponse = {
  response: string;
  error: unknown | null;
  nfts: NFTItem[];
  total: number;
};
