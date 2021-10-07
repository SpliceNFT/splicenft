const express = require('express');
const Render = require('./lib/render');
const { ethers, providers, BigNumber } = require('ethers');
const { Renderers, Splice } = require('@splicenft/common');
const axios = require('axios').default;

require('dotenv-flow').config();

const app = express();
const port = process.env.PORT || 5999;

const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATEKEY, provider);
const splice = Splice.from(process.env.SPLICE_CONTRACT_ADDRESS, wallet);

app.get('/render/:algo', (req, res) => {
  const renderer = Renderers[req.params.algo];
  if (!renderer) return res.status(404).send('algorithm not found');
  try {
    Render(renderer, res);
  } catch (e) {
    res.status(500).send(`rendering failed ${e.message}`);
  }
});

app.get('/validate/:mintjob', async (req, res) => {
  const mintJobId = req.params.mintjob;
  // const provider = new ethers.providers.InfuraWebSocketProvider(
  //   process.env.ETH_NETWORK as string,
  //   process.env.INFURA_KEY as string
  // );

  const _job = await splice.getMintJob(mintJobId);
  const token_id = _job['token_id'];
  const collection = _job['collection'];
  const randomness = _job['randomness'];
  const status = _job['status'];
  const metadataCID = _job['metadataCID'];

  const job = {
    token_id: token_id.toNumber(),
    collection,
    randomness,
    status,
    metadataCID
  };

  const _metadata = await axios.get(
    `https://ipfs.io/ipfs/${metadataCID}/metadata.json`
  );

  job.metadata = await _metadata.data;
  let imageLocation = job.metadata.image;
  imageLocation = imageLocation.replace('ipfs://', 'https://ipfs.io/ipfs/');

  console.log(imageLocation);
  const _blob = await axios.get(imageLocation);
  const blob = await _blob.data;
  console.log(blob.length);
  job.blobSize = blob.length;
  res.send(job);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
