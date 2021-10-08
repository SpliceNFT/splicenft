import axios from 'axios';
import { NFTItem, NftPortAccountResponse } from '@splicenft/common';

const BASE_URI = `https://api.nftport.xyz`;

type ChainOpt = 'ethereum' | 'tezos';

/**
 * https://docs.nftport.xyz/docs/nftport/b3A6MTc0MDA0NDI-return-nf-ts-owned-by-account
 */
export const getNFTs = async ({
  address,
  chain = 'ethereum'
}: {
  address: string;
  chain: ChainOpt;
}): Promise<NFTItem[]> => {
  const url = `${BASE_URI}/account/${address}/nfts`;
  const auth = process.env.REACT_APP_NFTPORT_AUTH as string;

  const _resp = await axios.get<NftPortAccountResponse>(url, {
    params: {
      chain,
      include: 'metadata'
    },
    headers: {
      Authorization: auth
    }
  });
  return _resp.data.nfts;
};
