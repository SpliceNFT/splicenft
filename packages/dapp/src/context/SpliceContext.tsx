import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client';
import {
  CHAINS,
  Splice,
  SpliceDeployInfo,
  SPLICE_ADDRESSES
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

export type ApolloClientType = ApolloClient<NormalizedCacheObject>;
interface ISpliceContext {
  splice?: Splice;
  deployInfo?: SpliceDeployInfo;
}

const SpliceContext = React.createContext<ISpliceContext>({});

const useSplice = () => useContext(SpliceContext);

const SpliceProvider = ({ children }: { children: React.ReactNode }) => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  const [deployInfo, setDeployInfo] = useState<SpliceDeployInfo>();
  const [apolloClient, setApolloClient] = useState<ApolloClientType>(
    new ApolloClient({
      uri: '',
      cache: new InMemoryCache()
    })
  );

  useEffect(() => {
    let _deployInfo;
    if (!chainId || !SPLICE_ADDRESSES[chainId]) {
      setDeployInfo(undefined);
      _deployInfo = SPLICE_ADDRESSES[1];
    } else {
      _deployInfo = SPLICE_ADDRESSES[chainId];
      setDeployInfo(_deployInfo);
    }

    if (_deployInfo?.subgraph) {
      setApolloClient(
        new ApolloClient({
          uri: _deployInfo.subgraph,
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
        _deployInfo.address,
        library.getSigner(),
        _deployInfo.deployedAt
      ).then(setSplice);
    }
  }, [library, chainId]);

  return (
    <SpliceContext.Provider value={{ splice, deployInfo }}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </SpliceContext.Provider>
  );
};

export { SpliceProvider, useSplice };
