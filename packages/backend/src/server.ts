import { RGB, StyleNFTResponse } from '@splicenft/common';
import cors from 'cors';
import express, { Express, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import Artwork from './lib/Artwork';
import Metadata from './lib/Metadata';
import Render from './lib/render';
import { providerFor, SpliceInstances } from './lib/SpliceContracts';
import { StyleCache } from './lib/StyleCache';

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
  return (err: any | null, buffer: Buffer) => {
    if (err) {
      console.error(err);
      return res.status(500).end();
    }

    res.set('Content-Type', 'image/png');
    res.status(200);
    res.send(buffer);
  };
};

//generic renderer
app.get('/render/:network/:style_token_id', async (req, res) => {
  //const renderer = Renderers[req.params.algo];
  //if (!renderer) return res.status(404).send('algorithm not found');
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
        code_url: `/styles/${networkId}/${style.tokenId}`,
        metadata: style.getMetadata()
      };
    })();
  });
  const styles: StyleNFTResponse[] = await Promise.all(promises);

  res.json(styles);
});

//this is the token metadata URI:  /1/1
app.get('/metadata/:network/:tokenid', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const tokenId = parseInt(req.params.tokenid);

  const cache = styleCache.getCache(networkId);
  const splice = SpliceInstances[networkId];

  if (!cache || !splice)
    return res.status(500).send(`network ${networkId} not supported`);

  const metadata = await Metadata(splice, cache, tokenId);
  metadata.image = `${process.env.SERVER_BASE_URL}/splice/${networkId}/${tokenId}/image.png`;
  res.send(metadata);
});

app.get('/splice/:network/:tokenid/image.png', async (req, res) => {
  const networkId = parseInt(req.params.network);
  const tokenId = parseInt(req.params.tokenid);
  const cache = styleCache.getCache(networkId);
  const splice = SpliceInstances[networkId];
  const provider = providerFor(networkId);
  if (!cache || !splice || !provider)
    return res.status(500).send(`network ${networkId} not supported`);
  try {
    await Artwork(provider, cache, splice, tokenId, ImageCallback(res));
  } catch (e: any) {
    res.status(500).send(`couldnt create image :( ${e.message}`);
  }
});

export default app;
