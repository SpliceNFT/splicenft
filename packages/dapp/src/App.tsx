import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Web3ReactProvider } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';
import Main from './Main';
import theme from './theme';

function getLibrary(provider: any) {
  return new providers.Web3Provider(provider);
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Main />
      </Web3ReactProvider>
    </ChakraProvider>
  );
}

export default App;
