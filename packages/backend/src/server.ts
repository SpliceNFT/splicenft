import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { createConnection } from 'typeorm';
import {
  allowlist,
  allStyles,
  renderGeneric,
  renderSplice,
  spliceMetadata,
  styleDetails
} from './controllers';
import { extractColors } from './controllers/colors';
import { nftMetadata } from './controllers/metadata';
import { proxy } from './controllers/proxy';
import { renderCode } from './controllers/renderers';
import { StyleCache } from './lib/StyleCache';

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
app.use(cors());

const styleCache = new StyleCache([4, 31337]);
styleCache.init();
app.get('/proxy', proxy());
app.get('/nft/:network/:collection/:token_id', nftMetadata());
app.get('/render/:network/:style_token_id', renderGeneric(styleCache));
//app.post('/render', renderCode);
app.get('/colors/:network/:collection/:token_id', extractColors);
app.get('/styles/:network/:style_token_id', styleDetails(styleCache));
app.get('/styles/:network', allStyles(styleCache));
app.get('/splice/:network/:tokenid/image.png', renderSplice(styleCache));
//this is the token metadata URI:  /1/1
app.get('/splice/:network/:tokenid', spliceMetadata(styleCache));

createConnection({
  type: 'sqlite',
  database: 'splice.sqlite',
  entities: [__dirname + '/entity/*.js'],
  synchronize: true
}).then((sqlite) => {
  app.post('/allowlist', allowlist());
});

export default app;
