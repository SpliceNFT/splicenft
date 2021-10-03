import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import IpfsHash from 'ipfs-only-hash';
import { CID } from 'multiformats/cid';
import {
  Splice,
  Splice__factory,
  TestnetNFT,
  TestnetNFT__factory
} from '../typechain';
import { TransferEvent } from '../typechain/ERC721';
import { MintRequestedEvent } from '../typechain/Splice';

describe('Splice', function () {
  let nft: TestnetNFT;
  let splice: Splice;
  let signers: Signer[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
  });

  it('deploys nft and splice', async function () {
    const TestnetNFTFactory = (await ethers.getContractFactory(
      'TestnetNFT'
    )) as TestnetNFT__factory;
    nft = (await TestnetNFTFactory.deploy(
      'TestnetNFT',
      'COOL',
      'https://api.coolcatsnft.com/cat/',
      10000
    )) as TestnetNFT;

    const SpliceFactory = (await ethers.getContractFactory(
      'Splice'
    )) as Splice__factory;
    splice = (await upgrades.deployProxy(SpliceFactory, [
      'Splice',
      'SPLICE',
      'ipfs://',
      10000
    ])) as Splice;
  });

  it('gets an nft on the test collection', async function () {
    const requestor = await signers[19].getAddress();
    nft.connect(signers[19]);
    const transaction = await nft.mint(requestor);
    const result = await transaction.wait();
    expect(result.events).to.exist;

    const transferEvent: TransferEvent = result.events![0] as TransferEvent;
    expect(transferEvent.args.tokenId).to.eq(1);
  });

  // it('can not mint on non whitelisted collections', async function () {
  //   const requestor = await signers[19].getAddress();
  //   splice.connect(signers[19]);

  //   const tx = await splice.requestMint(
  //     nft.address,
  //     1,
  //     '0xabcdef',
  //     '0xff3300ee99ff333344',
  //     requestor
  //   );
  // });

  it('can request a mint job and add a cid as bytes on chain', async function () {
    await splice.allowCollection(nft.address);

    const requestor = await signers[19].getAddress();
    splice = splice.connect(signers[19]);
    const content = 'this is a text file.\n';
    const cid = await IpfsHash.of(content);
    expect(cid).to.equal('QmfBAZkuu5DLDcPztFHzsaV3UDourKqqPsqm2x1KYFULSY');

    const bcid = CID.parse(cid);
    const cidBytes = Buffer.from(bcid.bytes.slice(2));
    const cidHex = `0x${cidBytes.toString('hex')}`;

    const tx = await splice.requestMint(nft.address, 1, cidHex, requestor);
    const result = await tx.wait();
    const requestedEvent: MintRequestedEvent =
      result.events![0] as MintRequestedEvent;
    const jobId = requestedEvent.args.jobIndex;

    expect(jobId).to.equal(0);
  });

  it('can retrieve a mint job and read the CID from chain', async function () {
    const mintJob = await splice.getMintJob(0);
    expect(mintJob.token_id).to.equal(1);
    expect(mintJob.nft).to.equal(nft.address);
    expect(mintJob.requestor).to.equal(await signers[19].getAddress());

    const jobCidB58 = await splice.getJobCidB58(0);
    expect(jobCidB58).to.be.equal(
      'QmfBAZkuu5DLDcPztFHzsaV3UDourKqqPsqm2x1KYFULSY'
    );

    const jobTokenUrl = await splice.getJobTokenUrl(0);
    expect(jobTokenUrl).to.be.equal(
      'ipfs://QmfBAZkuu5DLDcPztFHzsaV3UDourKqqPsqm2x1KYFULSY'
    );
  });
});