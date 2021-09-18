import { ChakraProvider } from "@chakra-ui/react";
import React from 'react';
import Main from './Main';
import { Web3ReactProvider } from '@web3-react/core'
import { providers } from 'ethers'

function getLibrary(provider: any) {
  return new providers.Web3Provider(provider)
}

function App() {
  return (
   <ChakraProvider>
    <Web3ReactProvider
        getLibrary={getLibrary}>
      <Main />
    </Web3ReactProvider>
   </ChakraProvider>
  );
}

export default App;
