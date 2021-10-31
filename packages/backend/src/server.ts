import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import Render from './lib/render';
import Validate from './lib/validate';
import chalk from 'chalk';
import { SpliceInstances } from './lib/SpliceContracts';
import { StyleCache } from './lib/StyleCache';
import { StyleNFTResponse } from '@splicenft/common';

const app: Express = express();

app.set('json spaces', 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1); // trust first proxy

// Handle logs in console during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use(cors());
}

// Handle security and origin in production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('short'));
  app.use(helmet());
}

import { Splice, getProvider, SPLICE_ADDRESSES, RGB } from '@splicenft/common';
import Metadata from './lib/Metadata';

const styleCache = new StyleCache([31337]);
styleCache.init();

const GRAYSCALE_COLORS: RGB[] = [
  [20, 30, 40],
  [80, 80, 80],
  [100, 100, 100],
  [150, 150, 150],
  [175, 175, 175],
  [200, 200, 200],
  [220, 220, 220],
  [250, 250, 250]
];

app.get('/render/:network/:style_token_id', async (req, res) => {
  //const renderer = Renderers[req.params.algo];
  //if (!renderer) return res.status(404).send('algorithm not found');
  const networkId = parseInt(req.params.network);
  const styleTokenId = parseInt(req.params.style_token_id);

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const style = cache.getStyle(styleTokenId);
  if (!style) {
    return res
      .status(500)
      .send(`style ${styleTokenId} not available on network ${networkId}`);
  }
  const renderer = await style.getRenderer();

  try {
    Render(
      renderer,
      {
        colors: GRAYSCALE_COLORS,
        dim: { w: 1500, h: 500 },
        randomness: 1
      },
      (err: any | null, buffer: Buffer) => {
        if (err) {
          console.error(err);
          return res.status(500).end();
        }
        res.set('Content-Type', 'image/png');
        res.status(200);
        res.send(buffer);
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

app.get('/styles/:network/:style_token_id', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const styleTokenId = parseInt(req.params.style_token_id);

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const style = cache.getStyle(styleTokenId);
  if (!style) {
    return res
      .status(500)
      .send(`style ${styleTokenId} not available on network ${networkId}`);
  }
  const code = await style.getCode();
  res.json({
    style_token_id: style.tokenId,
    metadata: style.getMetadata(),
    code
  });
});

app.get('/styles/:network', async (req, res) => {
  const networkId = req.params.network;

  const cache = styleCache.getCache(parseInt(networkId));
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const promises = cache.getStyles().map((style) => {
    return (async () => {
      return {
        style_token_id: style.tokenId,
        metadata: style.getMetadata()
      };
    })();
  });
  const styles: StyleNFTResponse[] = await Promise.all(promises);

  res.json(styles);
});

// /1/1
app.get('/:network/:tokenid', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const tokenId = parseInt(req.params.tokenid);

  const cache = styleCache.getCache(networkId);
  const splice = SpliceInstances[networkId];

  if (!cache || !splice)
    return res.status(500).send(`network ${networkId} not supported`);

  const metadata = await Metadata(splice, cache, tokenId);
  res.send(metadata);
});

export default app;
