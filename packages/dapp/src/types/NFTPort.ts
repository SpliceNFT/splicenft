export type NFTTrait = {
  trait_type: string;
  value: string;
};
export type NFTMetaData = {
  name: string;
  description: string;
  attributes?: NFTTrait[];
  properties?: NFTTrait[];
  tags?: string[];
  home_url?: string;
  image_url?: string;
  image?: string;
  google_image?: string;
  ipfs_image?: string;
  external_url: null | string;
  animation_url?: string;
  points?: Record<string, string | number>;
};

export type NFTItem = {
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  asset_url: string;
  metadata: null | NFTMetaData;
};

export type NftPortAccountResponse = {
  response: string;
  error: unknown | null;
  nfts: NFTItem[];
  total: number;
};
