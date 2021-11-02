import { Splice, getProvider, SPLICE_ADDRESSES } from '@splicenft/common';
import { providers } from 'ethers';

import CHAINS from './networks';

export const SpliceInstances: Record<string, Splice> = {};

[4, 31337].map((networkId) => {
  const provider = providerFor(networkId);
  if (!provider) return;

  const spliceAddress =
    SPLICE_ADDRESSES[networkId] || process.env.SPLICE_CONTRACT_ADDRESS;
  if (spliceAddress) {
    SpliceInstances[networkId] = Splice.from(spliceAddress, provider);
  }
});

export function providerFor(networkId: number): providers.Provider | undefined {
  const network = CHAINS[networkId];
  if (!network) return;

  const { provider } = getProvider(network, {
    infuraKey: process.env.INFURA_KEY
  });
  return provider;
}
