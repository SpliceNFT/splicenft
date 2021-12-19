export interface UserSplice {
  id: string;
  metadata_url: string;
  style?: {
    id: string;
    metadata_url: string;
  };
  origins: Array<{
    collection?: string;
    token_id?: string;
    metadata_url?: string;
  }>;
}

export interface StyleMetadataResponse {
  tokenId: string;
  metadataUrl: string;
}
