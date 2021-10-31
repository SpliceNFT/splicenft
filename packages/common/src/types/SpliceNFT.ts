import { NFTMetaData } from './NFT';
import { RGB } from './Renderers';

/**
 * metadata structure of Splice NFTs
 */
export type SpliceNFT = NFTMetaData & {
  properties: {
    colors: RGB[];
    origin_collection: string;
    origin_token_id: string;
    randomness: number;
    style: string;
  };
};

/**
 * metadata structure of Splice Style NFTs
 */
export type StyleNFT = NFTMetaData & {
  properties: {
    code: string;
    code_library: string;
    code_library_version: string;
    creator_name?: string;
    creator_twitter?: string;
  };
};

export type StyleNFTResponse = {
  style_token_id: number;
  metadata: StyleNFT;
};
