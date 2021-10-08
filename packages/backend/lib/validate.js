const axios = require('axios').default;

module.exports = async function (mintJobId, splice) {
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

  //todo: get directly from ipfs
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
  return job;
};
