import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { createConnection } from 'typeorm';
import {
  allowlist,
  allStyles,
  extractColors,
  nftMetadata,
  proxy,
  renderGeneric,
  renderSplice,
  spliceMetadata,
  styleDetails
} from './controllers';
import { styleCache } from './lib/StyleCache';

const app: Express = express();

app.set('json spaces', 4);
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1); // trust first proxy

// Handle logs in console during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Handle security and origin in production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      }
    })
  );
}
styleCache.init();
app.use(cors());

app.get('/colors/:network/:collection/:token_id', extractColors);
app.get('/nft/:network/:collection/:token_id', nftMetadata);
app.get('/proxy', proxy());
app.get('/render/:network/:style_token_id', renderGeneric);
//app.post('/render', renderCode);
app.get('/splice/:network/:tokenid', spliceMetadata);
app.get('/splice/:network/:tokenid/image.png', renderSplice);
app.get('/styles/:network', allStyles);
app.get('/styles/:network/:style_token_id', styleDetails);
//this is the token metadata URI:  /1/1

createConnection({
  type: 'sqlite',
  database: 'splice.sqlite',
  entities: [__dirname + '/entity/*.js'],
  synchronize: true
}).then((sqlite) => {
  app.post('/allowlist', allowlist());
});

export default app;
