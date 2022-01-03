import { expect } from 'chai';
import { ipfsGW } from '../src';
import { isIpfsLocation, getIpfsPath } from '../src/img';

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

it('detects IPFS gateway urls', function () {
  expect(
    isIpfsLocation(
      'https://ipfs.io/ipfs/QmTjja7adWB7gFXPRxAP78pnzwp7nTmoecjUXqZpkzFTks/6642.JPEG'
    )
  ).to.be.true;

  expect(
    isIpfsLocation(
      'https://gateway.pinata.cloud/ipfs/QmeoHYZKedBUn5psxdUtgtmt4s1mDgwTUtpF4k31pDLQdp/500'
    )
  ).to.be.true;
});

it('extracts CIDs & files from gateway URLs', function () {
  expect(
    getIpfsPath(
      'https://gateway.pinata.cloud/ipfs/QmeoHYZKedBUn5psxdUtgtmt4s1mDgwTUtpF4k31pDLQdp/500'
    )
  ).to.equal('QmeoHYZKedBUn5psxdUtgtmt4s1mDgwTUtpF4k31pDLQdp/500');

  expect(
    getIpfsPath(
      'https://ipfs.getsplice.io/ipfs/QmTjja7adWB7gFXPRxAP78pnzwp7nTmoecjUXqZpkzFTks/6643.JPEG'
    )
  ).to.equal('QmTjja7adWB7gFXPRxAP78pnzwp7nTmoecjUXqZpkzFTks/6643.JPEG');

  expect(
    getIpfsPath(
      'https://ipfs.io/ipfs/QmTjja7adWB7gFXPRxAP78pnzwp7nTmoecjUXqZpkzFTks/'
    )
  ).to.equal('QmTjja7adWB7gFXPRxAP78pnzwp7nTmoecjUXqZpkzFTks/');
});

it('fails when not an IPFS path', function () {
  expect(isIpfsLocation('https://foo.bar/boo')).to.be.false;
  expect(() => getIpfsPath('https://foo.bar/boo')).to.throw('not an ipfs path');
});
