import { useMatomo } from '@datapunt/matomo-tracker-react';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import React, { useEffect } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
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
  const history = useHistory();
  const { trackPageView } = useMatomo();
  useEffect(() => {
    if (!history) return;
    console.log(history.location.pathname);
    trackPageView({
      documentTitle: history.location.pathname
    });
    history.listen(() => {
      trackPageView({ documentTitle: history.location.pathname });
    });
  }, [history]);
  return (
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
  );
}
