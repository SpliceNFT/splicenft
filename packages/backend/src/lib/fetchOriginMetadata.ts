import { erc721, NFTMetaData } from '@splicenft/common';
import { BigNumberish } from 'ethers';
import { providerFor } from '../lib/SpliceContracts';
import { withCache } from './Cache';
import { getOriginMetadata } from './getOriginMetadata';

export const fetchOriginMetadata = async (
  networkId: number,
  collection: string,
  token_id: BigNumberish,
  invalidate = false
): Promise<NFTMetaData> => {
  const provider = providerFor(networkId);
  if (!provider)
    throw new Error(`Splice is not available for network ${networkId}`);

  const metadata = await withCache<NFTMetaData>(
    `${networkId}/nft/${collection}/${token_id}/metadata.json`,
    () => {
      const contract = erc721(provider, collection);
      return getOriginMetadata(contract, token_id);
    },
    invalidate
  );

  return metadata;
};
