import { Splice, getProvider, SPLICE_ADDRESSES } from '@splicenft/common';
import { providers } from 'ethers';

import CHAINS from './networks';

export async function getSplice(networkId: number): Promise<Splice> {
  const provider = providerFor(networkId);
  if (!provider)
    throw new Error(`Splice is not available for network ${networkId}`);

  if (networkId === 31337) {
    return Splice.from(
      process.env.SPLICE_CONTRACT_ADDRESS as string,
      provider,
      0
    );
  } else {
    const { address, deployedAt } = SPLICE_ADDRESSES[networkId];
    if (!address) {
      throw new Error(`Splice is not available for network ${networkId}`);
    } else {
      return Splice.from(address, provider, deployedAt);
    }
  }
}

export function providerFor(networkId: number): providers.Provider | undefined {
  const network = CHAINS[networkId];
  if (!network) return;

  const { provider } = getProvider(network, {
    infuraKey: process.env.INFURA_KEY
  });
  return provider;
}
