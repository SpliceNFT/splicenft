import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client';
import {
  ActiveStyle,
  CHAINS,
  Splice,
  SPLICE_ADDRESSES,
  Style,
  StyleNFTResponse
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import { providers } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

interface ISpliceContext {
  splice?: Splice;
  spliceStyles: Style[];
}

const SpliceContext = React.createContext<ISpliceContext>({ spliceStyles: [] });

const useSplice = () => useContext(SpliceContext);

type ApolloClientType = ApolloClient<NormalizedCacheObject>;
const SpliceProvider = ({ children }: { children: React.ReactNode }) => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
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
      const deployInfo = SPLICE_ADDRESSES[chainId];
      if (deployInfo) {
        if (deployInfo.subgraph) {
          setApolloClient(
            new ApolloClient({
              uri: deployInfo.subgraph,
              cache: new InMemoryCache()
            })
          );
        }

        setSplice(
          Splice.from(
            deployInfo.address,
            library.getSigner(),
            deployInfo.deployedAt
          )
        );
      } else {
        setSplice(undefined);
      }
    }
  }, [library, chainId]);

  useEffect(() => {
    if (!chainId) return;

    (async () => {
      const url = `${process.env.REACT_APP_VALIDATOR_BASEURL}/styles/${chainId}`;

      try {
        const styleRes: StyleNFTResponse[] = await (await axios.get(url)).data;
        const styleNFTContract = splice ? await splice.getStyleNFT() : null;

        const _styles = styleRes.map((r) => {
          if (styleNFTContract) {
            return new ActiveStyle(
              styleNFTContract,
              r.style_token_id,
              url,
              r.metadata
            );
          } else {
            return new Style(r.style_token_id, url, r.metadata);
          }
        });
        setStyles(_styles);
      } catch (e: any) {
        console.error("couldn't load styles", e.message);
      }
    })();
  }, [chainId, splice]);

  return (
    <SpliceContext.Provider value={{ splice, spliceStyles }}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </SpliceContext.Provider>
  );
};

export { SpliceProvider, useSplice };
