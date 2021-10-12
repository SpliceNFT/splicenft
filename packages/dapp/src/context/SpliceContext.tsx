import { useWeb3React } from '@web3-react/core';
import React, { useContext, useEffect, useState } from 'react';
import { providers } from 'ethers';
import {
  CHAINS,
  NFTIndexer,
  NFTPort,
  OnChain,
  Splice,
  SPLICE_ADDRESSES
} from '@splicenft/common';
import { knownCollections } from '../modules/chains';

interface ISpliceContext {
  splice?: Splice;
  indexer?: NFTIndexer;
}

const SpliceContext = React.createContext<ISpliceContext>({});

const useSplice = () => useContext(SpliceContext);

const SpliceProvider = ({ children }: { children: React.ReactNode }) => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  const [indexer, setIndexer] = useState<NFTIndexer>();

  useEffect(() => {
    if (!library || !chainId) return;

    const chain = CHAINS[chainId];
    if (!chain) throw `chain ${chainId} unsupported`;

    const splAddress =
      chain === 'localhost'
        ? (process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string)
        : SPLICE_ADDRESSES[chainId];

    if (splAddress) {
      setSplice(Splice.from(splAddress, library.getSigner()));
    }

    switch (chain) {
      case 'ethereum':
        setIndexer(
          new NFTPort(chain, process.env.REACT_APP_NFTPORT_AUTH as string)
        );
        break;

      default:
        setIndexer(
          new OnChain(
            chain,
            library,
            knownCollections,
            process.env.REACT_APP_CORS_PROXY
          )
        );
    }
  }, [library, chainId]);

  return (
    <SpliceContext.Provider value={{ splice, indexer }}>
      {children}
    </SpliceContext.Provider>
  );
};

export { SpliceProvider, useSplice };
