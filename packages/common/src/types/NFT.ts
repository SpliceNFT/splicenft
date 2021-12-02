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
  image_data?: string; //contains an encoded representation, generated on chain
  google_image?: string;
  ipfs_image?: string;
  external_url?: string;
  animation_url?: string;
};

interface BaseNFTItem {
  contract_address: string;
  token_id: string;
  name?: string;
  description?: string;
}

export interface NFTItem extends BaseNFTItem {
  metadata: NFTMetaData;
}

export interface _NFTPortNFTItem {
  file_url?: string;
  cached_file_url?: string;
  creator_address?: string;
}

export interface NFTPortNFTItem extends NFTItem, _NFTPortNFTItem {}

export interface NFTItemInTransit extends BaseNFTItem, _NFTPortNFTItem {
  metadata: null | NFTMetaData | Promise<NFTMetaData | null>;
}
