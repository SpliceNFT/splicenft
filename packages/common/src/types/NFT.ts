//this is a little mixed between what we found on covalent and nft port

export type NFTTrait = {
  trait_type: string;
  value: string;
};

export type NFTMetaData = {
  name: string;
  description: string;
  attributes?: NFTTrait[];
  properties?: Record<string, any>;
  tags?: string[];
  home_url?: string;
  image_url?: string;
  image?: string;
  google_image?: string;
  ipfs_image?: string;
  external_url?: string;
  animation_url?: string;
};

type BaseNFTItem = {
  contract_address: string;
  token_id: string;
  name?: string;
  description?: string;
};

export type NFTItem = BaseNFTItem & {
  metadata: NFTMetaData;
};

export type NFTItemInTransit = BaseNFTItem & {
  metadata: null | NFTMetaData | Promise<NFTMetaData | null>;
};
