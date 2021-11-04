import { RGB, StyleNFTResponse } from '@splicenft/common';
import cors from 'cors';
import express, { Express, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Readable } from 'stream';
import Artwork from './lib/Artwork';
import Metadata from './lib/Metadata';
import Render from './lib/render';
import { StyleCache } from './lib/StyleCache';
import * as Cache from './lib/Cache';

const app: Express = express();

app.set('json spaces', 4);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1); // trust first proxy

// Handle logs in console during development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Handle security and origin in production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('short'));
  app.use(helmet());
}
app.use(cors());

const styleCache = new StyleCache([4, 31337]);
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

const ImageCallback = (res: Response) => {
  return (err: any | null, readable: Readable) => {
    if (err) {
      console.error(err);
      return res.status(500).end();
    }

    res.set('Content-Type', 'image/png');
    res.status(200);
    readable.pipe(res);
  };
};

//generic renderer
app.get('/render/:network/:style_token_id', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const styleTokenId = req.params.style_token_id;

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const style = cache.getStyle(styleTokenId);
  if (!style) {
    return res
      .status(404)
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
      ImageCallback(res)
    );
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

app.get('/styles/:network/:style_token_id', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const styleTokenId = req.params.style_token_id;

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const style = cache.getStyle(styleTokenId);
  if (!style) {
    return res
      .status(500)
      .send(`style ${styleTokenId} not available on network ${networkId}`);
  }
  const key = `${networkId}/styles/${styleTokenId}/code.js`;
  let code = await Cache.lookupString(key);
  if (!code) {
    code = await style.getCode();
    Cache.store(key, code);
  }
  res.json({
    style_token_id: style.tokenId,
    metadata: style.getMetadata(),
    code
  });
});

app.get('/styles/:network', async (req, res) => {
  const networkId = parseInt(req.params.network);

  const cache = styleCache.getCache(networkId);
  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  const promises = cache.getStyles().map((style) => {
    return (async () => {
      return {
        style_token_id: style.tokenId,
        code_url: `/styles/${networkId}/${style.tokenId}`,
        metadata: style.getMetadata()
      };
    })();
  });
  const styles: StyleNFTResponse[] = await Promise.all(promises);

  res.json(styles);
});

app.get('/splice/:network/:tokenid/image.png', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const tokenId = parseInt(req.params.tokenid);
  const cache = styleCache.getCache(networkId);

  if (!cache) return res.status(500).send(`network ${networkId} not supported`);
  try {
    await Artwork(cache, tokenId, ImageCallback(res));
  } catch (e: any) {
    res.status(500).send(`couldnt create image :( ${e.message}`);
  }
});

//this is the token metadata URI:  /1/1
app.get('/splice/:network/:tokenid', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const tokenId = parseInt(req.params.tokenid);

  const cache = styleCache.getCache(networkId);

  if (!cache) return res.status(500).send(`network ${networkId} not supported`);

  try {
    const metadata = await Metadata(cache, tokenId);
    metadata.image = `${process.env.SERVER_BASE_URL}/splice/${networkId}/${tokenId}/image.png`;
    res.send(metadata);
  } catch (e: any) {
    res.status(500).send(`couldnt create metadata :( ${e.message}`);
  }
});

export default app;
