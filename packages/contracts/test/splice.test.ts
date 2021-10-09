import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
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
      'SPLICE'
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

  it('can request a mint job and stores its metadata url on chain', async function () {
    await splice.allowCollection(nft.address, 3);

    const requestor = await signers[19].getAddress();
    splice = splice.connect(signers[19]);

    //it would be great to save data like this
    //but that's definitely harder with cid v1
    // const content = 'this is a text file.\n';
    // const cid = await IpfsHash.of(content);
    // expect(cid).to.equal('QmfBAZkuu5DLDcPztFHzsaV3UDourKqqPsqm2x1KYFULSY');
    // const bcid = CID.parse(cid);
    // const cidBytes = Buffer.from(bcid.bytes.slice(2));
    // const cidHex = `0x${cidBytes.toString('hex')}`;

    //this is what nft.storage returns:
    const metadataUrl =
      'ipfs://bafyreigzd5kddqovnuocdro4ck27yemkd3p565mqiixpkpyiub6ww56xhm/metadata.json';

    let cid = metadataUrl.replace('ipfs://', '');
    cid = cid.replace('/metadata.json', '');

    const tx = await splice.requestMint(nft.address, 1, cid, requestor);
    const result = await tx.wait();
    const requestedEvent: MintRequestedEvent =
      result.events![0] as MintRequestedEvent;
    const jobId = requestedEvent.args.jobId;

    expect(jobId).to.equal(0);
  });

  it('can retrieve a mint job and read the metadata from chain', async function () {
    const mintJob = await splice.getMintJob(0);
    expect(mintJob.token_id).to.equal(1);
    expect(mintJob.collection).to.equal(nft.address);
    expect(mintJob.requestor).to.equal(await signers[19].getAddress());

    const jobMetaDataURI = await splice.getJobMetadataURI(0);

    expect(jobMetaDataURI).to.be.equal(
      'ipfs://bafyreigzd5kddqovnuocdro4ck27yemkd3p565mqiixpkpyiub6ww56xhm/metadata.json'
    );
  });

  // it('can compute randomness on and offchain', async () => {
  //   //import { Splice as CSplice } from '@splicenft/common';
  //   const rnd = await splice.randomness(nft.address, 1);
  //   const rndLocal = CSplice.computeRandomnessLocally(nft.address, 1);

  //   expect(rnd).to.be.equal(rndLocal);
  // });
});
