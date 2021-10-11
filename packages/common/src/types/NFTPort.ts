import { NFTItem } from './NFT';

export type NftPortAccountResponse = {
  response: string;
  error: unknown | null;
  nfts: NFTItem[];
  total: number;
};
