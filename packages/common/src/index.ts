export * from './Splice';
export { Style } from './Style';
export * from './types/NFT';
export * from './types/SpliceNFT';

export { default as getProvider } from './provider';
export { resolveImage, ipfsGW, extractColors, extractPalette } from './img';
export { CHAINS, ChainOpt } from './types/Chains';
export * from './types/Renderers';
export { NFTIndexer } from './indexers/NFTIndexer';
export { NFTPort } from './indexers/NFTPort';
export { OnChain } from './indexers/OnChain';
export { Fallback as FallbackIndexer } from './indexers/Fallback';

export * as Transfer from './types/TransferObjects';

import {
  ERC721,
  ERC721Enumerable,
  ERC721Enumerable__factory,
  ERC721__factory
} from '@splicenft/contracts';
import { providers, Signer } from 'ethers';

export { ERC721 };
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

export * as AllowList from './allowlists';
