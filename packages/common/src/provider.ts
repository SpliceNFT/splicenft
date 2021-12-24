import { providers, Signer, Wallet } from 'ethers';

export default (
  network: string,
  options: {
    infuraKey?: string;
    privateKey?: string;
  }
): {
  provider: providers.BaseProvider;
  signer?: Signer;
} => {
  let provider: providers.BaseProvider;
  if (network.startsWith('http')) {
    provider = new providers.JsonRpcProvider(network);
  } else {
    provider = new providers.InfuraWebSocketProvider(
      network,
      options.infuraKey
    );
  }
  let wallet: Signer | undefined;
  if (options.privateKey) {
    wallet = new Wallet(options.privateKey, provider);
  }
  return {
    provider,
    signer: wallet
  };
};
