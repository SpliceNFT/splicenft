import { ChakraProvider } from '@chakra-ui/react';
import { Web3ReactProvider } from '@web3-react/core';
import { providers } from 'ethers';
import { Helmet } from 'react-helmet';
import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { Footer } from './components/molecules/Footer';
import Header from './components/molecules/Header';
import { SubFooter } from './components/molecules/SubFooter';
import { MyAssetsPage } from './components/pages/MyAssets';
import { MySplicesPage } from './components/pages/MySplices';
import { NFTPage } from './components/pages/NFTPage';
import { SpliceProvider } from './context/SpliceContext';
import theme from './theme';
import '@fontsource/barlow';

function getLibrary(provider: any) {
  return new providers.Web3Provider(provider);
}

const SITE_DESCRIPTION =
  'Splice is a protocol for generative art based on origin NFTs. Our first usecase is to mint header images for your PFP NFTs.';

const SITE_TITLE = 'S P L I C E - NFT artwork minter';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <SpliceProvider>
          <Helmet>
            <meta charSet="utf-8" />
            <meta name="description" content={SITE_DESCRIPTION} />
            <meta
              name="keywords"
              content="web3,dapp,nfts,generative art,ethereum"
            />
            <meta property="og:title" content={SITE_TITLE} />
            <meta property="og:type" content="Website" />
            <meta property="og:url" content="https://getsplice.io" />
            <meta property="og:description" content={SITE_DESCRIPTION} />
            <meta
              property="og:image"
              content="https://getsplice.io/splice_opengraph.jpg"
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@splicenft" />
            <meta name="twitter:title" content={SITE_TITLE} />
            <meta name="twitter:description" content={SITE_DESCRIPTION} />
            <meta
              name="twitter:image"
              content="https://getsplice.io/splice_opengraph.jpg"
            />
            <link rel="canonical" href="https://getsplice.io" />
          </Helmet>
          <Router>
            <Header />

            <Switch>
              <Route path="/nft/:collection/:token_id">
                <NFTPage />
              </Route>
              <Route path="/my-splices">
                <MySplicesPage />
              </Route>
              <Route path="/">
                <MyAssetsPage />
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
