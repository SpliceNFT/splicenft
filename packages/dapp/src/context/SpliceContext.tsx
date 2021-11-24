import { useWeb3React } from '@web3-react/core';
import React, { useContext, useEffect, useState } from 'react';
import { providers } from 'ethers';
import {
  CHAINS,
  FallbackIndexer,
  NFTIndexer,
  NFTPort,
  OnChain,
  Splice,
  SPLICE_ADDRESSES,
  Style,
  StyleNFTResponse
} from '@splicenft/common';
import { knownCollections } from '../modules/chains';
import axios from 'axios';
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client';

interface ISpliceContext {
  splice?: Splice;
  indexer?: NFTIndexer;
  spliceStyles: Style[];
}

const SpliceContext = React.createContext<ISpliceContext>({ spliceStyles: [] });

const useSplice = () => useContext(SpliceContext);

type ApolloClientType = ApolloClient<NormalizedCacheObject>;
const SpliceProvider = ({ children }: { children: React.ReactNode }) => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  const [indexer, setIndexer] = useState<NFTIndexer>();
  const [spliceStyles, setStyles] = useState<Style[]>([]);
  const [apolloClient, setApolloClient] = useState<ApolloClientType>(
    new ApolloClient({
      uri: '',
      cache: new InMemoryCache()
    })
  );

  useEffect(() => {
    if (!library || !chainId) return;

    const chain = CHAINS[chainId];
    if (!chain) {
      setSplice(undefined);
      setStyles([]);
      setIndexer(undefined);
      console.error(`chain ${chainId} unsupported`);
      return;
    }

    if (chain === 'localhost') {
      setSplice(
        Splice.from(
          process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string,
          library.getSigner(),
          20
        )
      );
    } else {
      const { address, deployedAt, subgraph } = SPLICE_ADDRESSES[chainId];

      setApolloClient(
        new ApolloClient({
          uri: subgraph,
          cache: new InMemoryCache()
        })
      );

      if (!address) {
        setSplice(undefined);
      } else {
        setSplice(Splice.from(address, library.getSigner(), deployedAt));
      }
    }

    switch (chain) {
      case 'ethereum':
        setIndexer(
          new FallbackIndexer(
            new NFTPort(chain, process.env.REACT_APP_NFTPORT_AUTH as string),
            new OnChain(
              library,
              knownCollections['ethereum'],
              process.env.REACT_APP_CORS_PROXY
            )
          )
        );
        break;

      default:
        setIndexer(
          new OnChain(
            library,
            knownCollections[chain],
            process.env.REACT_APP_CORS_PROXY
          )
        );
    }
  }, [library, chainId]);

  useEffect(() => {
    if (!splice) return;

    (async () => {
      const spliceChain = await splice.getChain();

      const styleNFTContract = await splice.getStyleNFT();
      const url = `${process.env.REACT_APP_VALIDATOR_BASEURL}/styles/${spliceChain}`;
      try {
        const styleRes: StyleNFTResponse[] = await (await axios.get(url)).data;
        const _styles = styleRes.map(
          (r) => new Style(styleNFTContract, r.style_token_id, url, r.metadata)
        );
        setStyles(_styles);
      } catch (e: any) {
        console.error("couldn't load styles", e.message);
      }
    })();
  }, [splice]);

  return (
    <SpliceContext.Provider value={{ splice, indexer, spliceStyles }}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </SpliceContext.Provider>
  );
};

export { SpliceProvider, useSplice };
