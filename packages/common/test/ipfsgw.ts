import { expect } from 'chai';
import { ipfsGW } from '../src';

it('redirects IPFS downloads to a defined ipfs gateway', async function () {
  expect(ipfsGW('ipfs://Qmabcdef')).to.eq(
    'https://ipfs.getsplice.io/ipfs/Qmabcdef'
  );
  expect(ipfsGW('ipfs://ipfs/Qmabcdef')).to.eq(
    'https://ipfs.getsplice.io/ipfs/Qmabcdef'
  );
  expect(ipfsGW('https://gateway.pinata.cloud/ipfs/Qmabcdef')).to.eq(
    'https://ipfs.getsplice.io/ipfs/Qmabcdef'
  );
  expect(ipfsGW('ipfs://Qmabcdef/file.json')).to.eq(
    'https://ipfs.getsplice.io/ipfs/Qmabcdef/file.json'
  );
  expect(ipfsGW('https://gateway.pinata.cloud/ipfs/Qmabcdef/file.json')).to.eq(
    'https://ipfs.getsplice.io/ipfs/Qmabcdef/file.json'
  );
});
