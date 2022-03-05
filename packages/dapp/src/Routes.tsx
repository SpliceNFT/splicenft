import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/molecules/Header';
import { AboutPage } from './components/pages/About';
import { MyAssetsPage } from './components/pages/MyAssets';
import { MySplicesPage } from './components/pages/MySplices';
import { NFTPage } from './components/pages/NFTPage';
import { RoadmapPage } from './components/pages/Roadmap';
import { StylesOverviewPage } from './components/pages/StylesOverview';

const CreatePage = React.lazy(() => import('./components/pages/Create'));
const StyleDetailPage = React.lazy(
  () => import('./components/pages/StyleDetailPage')
);

export function Routes() {
  return (
    <Router>
      <Header />

      <Switch>
        <Route path="/roadmap">
          <RoadmapPage />
        </Route>
        <Route path={['/my-assets/:accountAddress', '/my-assets']}>
          <MyAssetsPage />
        </Route>
        <Route path="/create">
          <React.Suspense fallback={<></>}>
            <CreatePage />
          </React.Suspense>
        </Route>
        <Route path="/nft/:collection/:token_id">
          <NFTPage />
        </Route>
        <Route path="/my-splices">
          <MySplicesPage />
        </Route>
        <Route path="/style/:style_id">
          <React.Suspense fallback={<></>}>
            <StyleDetailPage />
          </React.Suspense>
        </Route>
        <Route path="/styles">
          <StylesOverviewPage />
        </Route>
        <Route path="/">
          <AboutPage />
        </Route>
      </Switch>
    </Router>
  );
}
