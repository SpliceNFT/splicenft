import { NFTTrait } from './NFT';

type NFTExternalData = {
  name: string;
  description: string;
  image: string;
  image_256: string;
  image_512: string;
  image_1024: string;
  animation_url: null | string;
  external_url: null | string;
  attributes: NFTTrait[];
  owner: null | string;
};

type NFTData = {
  token_id: string;
  token_url: string;
  supports_erc: string[];
  external_data: NFTExternalData;
  owner: string | null;
  owner_address?: string | null;
  burned: boolean | null;
};

type NFTItem = {
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  supports_erc: string[];
  logo_url: string;
  type: 'nft' | 'cryptocurrency';
  balance: string; //sic
  nft_data: NFTData[];
};

export type CovalentNFTResponse = {
  data: {
    chain_id: number;
    address: string;
    updated_at: string;
    items: NFTItem[];
    pagination: unknown;
  };
  error: boolean;
  error_message: string | null;
  error_code: null | string | number;
};
