import { ChakraProvider, extendTheme, Container } from '@chakra-ui/react';
import { Web3ReactProvider } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';
import theme from './theme';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import Header from './components/molecules/Header';

import { NFTPage } from './components/pages/NFTPage';
import { MyAssetsPage } from './components/pages/MyAssets';

function getLibrary(provider: any) {
  return new providers.Web3Provider(provider);
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Router>
          <Header />

          <Switch>
            <Route path="/nft/:collection/:token_id">
              <NFTPage />
            </Route>

            <Route path="/">
              <MyAssetsPage />
            </Route>
          </Switch>
        </Router>
      </Web3ReactProvider>
    </ChakraProvider>
  );
}

export default App;
