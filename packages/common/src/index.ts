import {
  ERC721,
  ERC721Enumerable,
  ERC721Enumerable__factory,
  ERC721__factory,
  ISplicePriceStrategy,
  ReplaceablePaymentSplitter
} from '@splicenft/contracts';
import { providers, Signer } from 'ethers';

export { Histogram, RGB, rgbToHex } from '@splicenft/colors';
export * from './ActiveStyle';
export { AllowlistTypes, verifyAllowlistEntry } from './allowlists';
export {
  dataUriToBlob,
  getIpfsPath,
  ipfsGW,
  isIpfsLocation,
  resolveImage
} from './img';
export { Backend } from './indexers/Backend';
export { Fallback as FallbackIndexer } from './indexers/Fallback';
export { NFTIndexer } from './indexers/NFTIndexer';
export { NFTPort } from './indexers/NFTPort';
export { OnChain } from './indexers/OnChain';
export { default as getProvider } from './provider';
export * from './Splice';
export * from './Style';
export { ChainOpt, CHAINS } from './types/Chains';
export * from './types/NFT';
export * from './types/Renderers';
export * from './types/SpliceNFT';
export { Partnership, StyleStatsData } from './types/Styles';
export * as Transfer from './types/TransferObjects';
export { ERC721, ReplaceablePaymentSplitter, ISplicePriceStrategy };

export function erc721(
  provider: providers.Provider | Signer,
  address: string
): ERC721 {
  return ERC721__factory.connect(address, provider);
}
export function erc721Enumerable(
  provider: providers.Provider | Signer,
  address: string
): ERC721Enumerable {
  return ERC721Enumerable__factory.connect(address, provider);
}
