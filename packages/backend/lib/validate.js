const axios = require('axios').default;
const { Renderers, resolveImage } = require('@splicenft/common');
const Render = require('./render');
const PNG = require('pngjs').PNG;
const { utils } = require('ethers');

const DIFF_THRESHOLD = 10;
const TOLERATED_DIFF_PERC = 2;

const uint32ToUint8Array = (num) => {
  let ret = new Uint8Array(32);

  let arr = new ArrayBuffer(4); // an Uint32 takes 4 bytes
  let view = new DataView(arr);
  view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
  const _arr = new Uint8Array(arr);

  ret[0] = _arr[0];
  ret[1] = _arr[1];
  ret[2] = _arr[2];
  ret[3] = _arr[3];
  return ret;
};

module.exports = async function (mintJobId, splice, callback) {
  const _job = await splice.getMintJob(mintJobId);
  if (!_job) {
    return callback(`job ${mintJobId} doesnt exist`);
  }
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

  //todo: get directly from ipfs
  const _metadata = await axios.get(
    `https://ipfs.io/ipfs/${metadataCID}/metadata.json`
  );

  job.metadata = await _metadata.data;
  console.debug('checking job', job);

  let imageLocation = resolveImage(job.metadata);
  console.debug('user image location', imageLocation);

  const _blob = await axios.get(imageLocation, {
    responseType: 'arraybuffer'
  });
  const blob = await _blob.data;
  const style = job.metadata.properties.style;
  const renderer = Renderers[style];
  if (!renderer) throw `style ${style} unknown`;

  Render(
    renderer,
    {
      colors: job.metadata.properties.colors,
      randomness: job.randomness,
      dim: { w: 1500, h: 500 }
    },
    (err, buffer) => {
      if (err) {
        callback(err);
      }

      //todo: write the images to disk as proof
      const ours = PNG.sync.read(buffer);
      const theirs = PNG.sync.read(blob);

      if (
        ours.width !== theirs.width ||
        ours.height !== theirs.height ||
        ours.length !== theirs.length
      ) {
        return callback('the images have different dimensions', null);
      }
      let diffPx = 0;
      for (let idx = 0; idx < ours.data.length; idx++) {
        if (Math.abs(ours.data[idx] - theirs.data[idx]) > DIFF_THRESHOLD) {
          diffPx++;
        }
      }
      const relativeDiffcount = (diffPx * 100) / ours.data.length;

      if (relativeDiffcount > TOLERATED_DIFF_PERC) {
        return callback(
          `${relativeDiffcount}% pixels differ in the inputs`,
          null
        );
      }

      console.debug(`images only differ to ${relativeDiffcount}%. Thats ok.`);

      //build bytes32 return val
      let b32retVal = uint32ToUint8Array(mintJobId);
      //the last byte contains the result
      b32retVal[31] = 1;
      return callback(null, {
        valid: true,
        bytes32: utils.hexlify(b32retVal)
      });
    }
  );
};
