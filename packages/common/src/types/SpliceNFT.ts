import { ProvenanceOrigin } from '..';
import { NFTMetaData } from './NFT';
import { RGB } from '@splicenft/colors';

/**
 * metadata structure of Splice NFTs
 */
export type SpliceNFT = NFTMetaData & {
  properties: {
    style_name: string;
  };
  splice: {
    origins: ProvenanceOrigin[];
    style_metadata_url: string;
    style_collection: string;
    style_token_id: number;
    metadataUrl?: string;
    colors: RGB[];
    randomness: number;
  };
};

/**
 * metadata structure of Splice Style NFTs
 */
export type StyleNFT = NFTMetaData & {
  properties: Record<string, never>;
  code: string;
  splice: {
    creator_name?: string;
    creator_twitter?: string;
    creator_url?: string;
    code_library: string;
    code_library_version: string;
    license: string;
  };
};

export type StyleNFTResponse = {
  style_token_id: number;
  //a path to get the code, quick. Use the ipfs code prop if you don't trust us.
  code_url: string;
  metadata: StyleNFT;
};
