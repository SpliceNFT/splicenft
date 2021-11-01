import { useWeb3React } from '@web3-react/core';
import React, { useContext, useEffect, useState } from 'react';
import { providers } from 'ethers';
import {
  CHAINS,
  NFTIndexer,
  NFTPort,
  OnChain,
  Splice,
  SPLICE_ADDRESSES,
  StyleNFTResponse
} from '@splicenft/common';
import { knownCollections } from '../modules/chains';
import axios from 'axios';

interface ISpliceContext {
  splice?: Splice;
  indexer?: NFTIndexer;
  spliceStyles: StyleNFTResponse[];
}

const SpliceContext = React.createContext<ISpliceContext>({ spliceStyles: [] });

const useSplice = () => useContext(SpliceContext);

const SpliceProvider = ({ children }: { children: React.ReactNode }) => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  const [indexer, setIndexer] = useState<NFTIndexer>();
  const [spliceStyles, setStyles] = useState<StyleNFTResponse[]>([]);

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

  useEffect(() => {
    if (!splice) return;

    (async () => {
      const baseUrl = process.env.REACT_APP_VALIDATOR_BASEURL as string;
      const spliceChain = await splice.getChain();
      const url = `${baseUrl}/styles/${spliceChain}`;
      const _styles: StyleNFTResponse[] = await (await axios.get(url)).data;
      setStyles(_styles);
    })();
  }, [splice]);

  return (
    <SpliceContext.Provider value={{ splice, indexer, spliceStyles }}>
      {children}
    </SpliceContext.Provider>
  );
};

export { SpliceProvider, useSplice };
