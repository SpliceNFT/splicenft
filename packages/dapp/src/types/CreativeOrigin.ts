import { NFTItem } from '@splicenft/common';
import { Histogram } from '@splicenft/colors';

export type CreativeOrigin = {
  nft: NFTItem;
  histogram: Histogram;
  randomness: number;
};
