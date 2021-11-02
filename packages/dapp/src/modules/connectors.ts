import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';

export const injected = new InjectedConnector({
  supportedChainIds: [1, 4, 42, 1337, 31337]
});

export const walletconnect = new WalletConnectConnector({
  qrcode: true,
  infuraId: process.env.REACT_APP_INFURA_KEY,
  supportedChainIds: [1, 4, 42]
});
