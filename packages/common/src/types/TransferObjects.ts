export interface UserSplice {
  id: string;
  metadata_url: string;
  origin_collection?: string;
  origin_metadata_url?: string;
  origin_token_id?: string;
  style?: {
    id: string;
    metadata_url: string;
  };
}

export interface StyleMetadataResponse {
  tokenId: string;
  metadataUrl: string;
}
