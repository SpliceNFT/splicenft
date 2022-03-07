import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client';
import { CHAINS, Splice, SPLICE_ADDRESSES } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

type ApolloClientType = ApolloClient<NormalizedCacheObject>;
interface ISpliceContext {
  splice?: Splice;
}

const SpliceContext = React.createContext<ISpliceContext>({});

const useSplice = () => useContext(SpliceContext);

const SpliceProvider = ({ children }: { children: React.ReactNode }) => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  const [apolloClient, setApolloClient] = useState<ApolloClientType>(
    new ApolloClient({
      uri: '',
      cache: new InMemoryCache()
    })
  );

  useEffect(() => {
    const deployInfo = SPLICE_ADDRESSES[chainId || 1];

    if (deployInfo?.subgraph) {
      setApolloClient(
        new ApolloClient({
          uri: deployInfo.subgraph,
          cache: new InMemoryCache()
        })
      );
    } else {
      setApolloClient(
        new ApolloClient({
          uri: '',
          cache: new InMemoryCache()
        })
      );
    }

    if (!chainId || !library) {
      setSplice(undefined);
      return;
    }
    const chain = CHAINS[chainId];
    if (chain === 'localhost') {
      Splice.from(
        process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string,
        library.getSigner(),
        20
      ).then(setSplice);
    } else {
      Splice.from(
        deployInfo.address,
        library.getSigner(),
        deployInfo.deployedAt
      ).then(setSplice);
    }
  }, [library, chainId]);

  return (
    <SpliceContext.Provider value={{ splice }}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </SpliceContext.Provider>
  );
};

export { SpliceProvider, useSplice };
