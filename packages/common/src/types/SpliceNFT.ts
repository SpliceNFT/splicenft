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
