import { ChakraProvider } from '@chakra-ui/react';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import { Web3ReactProvider } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { Footer } from './components/molecules/Footer';
import Header from './components/molecules/Header';
import { SubFooter } from './components/molecules/SubFooter';
import { AboutPage } from './components/pages/About';
import { CreatePage } from './components/pages/Create';
import { StylesOverviewPage } from './components/pages/StylesOverview';
import { MyAssetsPage } from './components/pages/MyAssets';
import { MySplicesPage } from './components/pages/MySplices';
import { NFTPage } from './components/pages/NFTPage';
import { RoadmapPage } from './components/pages/Roadmap';
import { SpliceProvider } from './context/SpliceContext';
import theme from './theme';
import { StyleDetailPage } from './components/pages/StyleDetailPage';

function getLibrary(provider: any) {
  return new providers.Web3Provider(provider);
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <SpliceProvider>
          <Router>
            <Header />

            <Switch>
              <Route path="/nft/:collection/:token_id">
                <NFTPage />
              </Route>
              <Route path="/my-splices">
                <MySplicesPage />
              </Route>

              <Route path={['/my-assets/:accountAddress', '/my-assets']}>
                <MyAssetsPage />
              </Route>
              <Route path="/create">
                <CreatePage />
              </Route>
              <Route path="/style/:style_id">
                <StyleDetailPage />
              </Route>
              <Route path="/styles">
                <StylesOverviewPage />
              </Route>
              <Route path="/roadmap">
                <RoadmapPage />
              </Route>
              <Route path="/">
                <AboutPage />
              </Route>
            </Switch>
          </Router>
          <Footer />
          <SubFooter />
        </SpliceProvider>
      </Web3ReactProvider>
    </ChakraProvider>
  );
}

export default App;
