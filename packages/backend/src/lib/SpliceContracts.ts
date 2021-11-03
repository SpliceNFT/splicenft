import { Splice, getProvider, SPLICE_ADDRESSES } from '@splicenft/common';
import { providers } from 'ethers';

import CHAINS from './networks';

export function getSplice(networkId: number): Splice {
  const provider = providerFor(networkId);
  if (!provider)
    throw new Error(`Splice is not available for network ${networkId}`);

  const spliceAddress =
    SPLICE_ADDRESSES[networkId] || process.env.SPLICE_CONTRACT_ADDRESS;
  if (!spliceAddress) {
    throw new Error(`Splice is not available for network ${networkId}`);
  }
  return Splice.from(spliceAddress, provider);
}

export function providerFor(networkId: number): providers.Provider | undefined {
  const network = CHAINS[networkId];
  if (!network) return;

  const { provider } = getProvider(network, {
    infuraKey: process.env.INFURA_KEY
  });
  return provider;
}
