import { ChakraProvider } from '@chakra-ui/react';
import { createInstance, MatomoProvider } from '@datapunt/matomo-tracker-react';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import { Web3ReactProvider } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import Header from './components/molecules/Header';
import { Footer } from './components/molecules/Footer';
import { SubFooter } from './components/molecules/SubFooter';
import { AssetProvider } from './context/AssetContext';
import { SpliceProvider } from './context/SpliceContext';
import { StyleProvider } from './context/StyleContext';
import { Routes } from './Routes';
import theme from './theme';

function getLibrary(provider: any) {
  return new providers.Web3Provider(provider);
}

const matomo = createInstance({
  urlBase: process.env.REACT_APP_MATOMO_URL_BASE as string,
  siteId: parseInt(process.env.REACT_APP_MATOMO_SITE_ID as string),

  linkTracking: true
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <MatomoProvider value={matomo}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <SpliceProvider>
            <StyleProvider>
              <AssetProvider>
                <Router>
                  <Header />
                  <Routes />
                </Router>
                <Footer />
                <SubFooter />
              </AssetProvider>
            </StyleProvider>
          </SpliceProvider>
        </Web3ReactProvider>
      </MatomoProvider>
    </ChakraProvider>
  );
}

export default App;
