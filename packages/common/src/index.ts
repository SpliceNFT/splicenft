export * from './Splice';
export * from './Style';
export * from './types/NFT';
export * from './types/SpliceNFT';

export { default as getProvider } from './provider';
export {
  resolveImage,
  ipfsGW,
  isIpfsLocation,
  getIpfsPath,
  dataUriToBlob
} from './img';
export { CHAINS, ChainOpt } from './types/Chains';
export * from './types/Renderers';
export { NFTIndexer } from './indexers/NFTIndexer';
export { NFTPort } from './indexers/NFTPort';
export { OnChain } from './indexers/OnChain';
export { Backend } from './indexers/Backend';
export { Fallback as FallbackIndexer } from './indexers/Fallback';

export * as Transfer from './types/TransferObjects';
export * from './types/Styles';

export { RGB, Histogram, rgbToHex } from '@splicenft/colors';
import {
  ERC721,
  ERC721Enumerable,
  ERC721Enumerable__factory,
  ERC721__factory,
  ReplaceablePaymentSplitter,
  ISplicePriceStrategy
} from '@splicenft/contracts';
import { providers, Signer } from 'ethers';

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

export { AllowlistTypes, verifyAllowlistEntry } from './allowlists';
