//this is a little mixed between what we found on covalent and nft port

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
};

export type NFTItem = {
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  metadata: null | NFTMetaData;
};
