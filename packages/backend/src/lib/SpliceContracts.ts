import { Splice, getProvider, SPLICE_ADDRESSES } from '@splicenft/common';
import CHAINS from './networks';

export const SpliceInstances: Record<string, Splice> = {};

[1, 4, 42, 31337].map((networkId) => {
  const network = CHAINS[networkId];
  if (!network) return;

  const { provider } = getProvider(network, {
    infuraKey: process.env.INFURA_KEY
  });

  const spliceAddress =
    SPLICE_ADDRESSES[networkId] || process.env.SPLICE_CONTRACT_ADDRESS;
  if (spliceAddress) {
    SpliceInstances[networkId] = Splice.from(spliceAddress, provider);
  }
});
