import axios from 'axios';

const IPFSIO_GATEWAY = 'https://ipfs.io/ipfs/';
const IPFSDWEB_GATEWAY = 'https://dweb.link/ipfs/';
const B64_DATA_PREFIX = 'data:application/json;base64,';

export function pingPublicGateway(ipfsPath: string) {
  [IPFSIO_GATEWAY].map((gw) => {
    console.debug('prefetch timeout reached, pinging %s at %s', ipfsPath, gw);
    axios.get(`${gw}${ipfsPath}`);
  });
}
