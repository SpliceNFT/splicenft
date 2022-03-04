import { ChakraProvider } from '@chakra-ui/react';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import { Web3ReactProvider } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';
import { Footer } from './components/molecules/Footer';
import { SubFooter } from './components/molecules/SubFooter';
import { AssetProvider } from './context/AssetContext';
import { SpliceProvider } from './context/SpliceContext';
import { Routes } from './Routes';
import theme from './theme';

function getLibrary(provider: any) {
  return new providers.Web3Provider(provider);
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <SpliceProvider>
          <AssetProvider>
            <Routes />
            <Footer />
            <SubFooter />
          </AssetProvider>
        </SpliceProvider>
      </Web3ReactProvider>
    </ChakraProvider>
  );
}

export default App;
