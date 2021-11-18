import { expect } from 'chai';
import { Signer, Event } from 'ethers';
import { ethers } from 'hardhat';
import { of as ipfsHashOf } from 'ipfs-only-hash';
import {
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT,
  SpliceStyleNFT__factory,
  TestnetNFT
} from '../typechain';
import { TransferEvent } from '../typechain/ERC721';
import {
  deploySplice,
  deployStaticPriceStrategy,
  deployTestnetNFT
} from './lib/deployContracts';
import { mintStyle } from './lib/helpers';

describe('Style NFTs', function () {
  let testNft: TestnetNFT;
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;

  let signers: Signer[];
  let _curator: Signer;
  let _user: Signer;
  let _owner: Signer;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _curator = signers[18];
    _user = signers[19];
  });

  it('deploys nft and splice', async function () {
    splice = await deploySplice();
    testNft = await deployTestnetNFT();
    priceStrategy = await deployStaticPriceStrategy();
    const styleNftAddress = await splice.styleNFT();
    styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, signers[0]);
  });

  it('gets an nft on the test collection', async function () {
    const requestor = await _user.getAddress();
    const _nft = testNft.connect(_user);

    const transaction = await _nft.mint(requestor);
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

  it('can allow a new curator', async function () {
    styleNFT.connect(_owner);
    const curatorAddress = await _curator.getAddress();
    const tx = await (
      await styleNFT.toggleCurator(curatorAddress, true)
    ).wait();

    const res = await styleNFT.isCurator(await _curator.getAddress());
    expect(res).to.be.true;
  });

  it('can mint a new style', async function () {
    const curatorAddress = await _curator.getAddress();

    const _styleNft = styleNFT.connect(_curator);
    expect(await _styleNft.signer.getAddress()).to.equal(curatorAddress);

    const res = await _styleNft.isCurator(curatorAddress);
    expect(res).to.be.true;

    const fakeCid = await ipfsHashOf(Buffer.from('{this: is: fake}'));

    const minPriceWei = ethers.utils.parseEther('0.1');
    const priceHex = minPriceWei.toHexString();
    const priceBytes = ethers.utils.hexZeroPad(priceHex, 32);

    const tx = await _styleNft.mint(
      100,
      fakeCid,
      priceStrategy.address,
      priceBytes,
      false
    );
    const receipt = await tx.wait();

    const transferEvent = receipt.events?.find(
      (e: Event) => e.event === 'Transfer'
    );

    expect(transferEvent).to.not.be.undefined;
    const tokenId = (transferEvent as TransferEvent).args.tokenId;
    expect(tokenId.toNumber()).to.equal(1);

    const metadataUri = await _styleNft.tokenURI(tokenId);
    expect(metadataUri).to.equal(`ipfs://${fakeCid}/metadata.json`);
  });

  it('only curators can mint styles', async function () {
    const _styleNft = styleNFT.connect(_user);

    const fakeCid = await ipfsHashOf(Buffer.from('{this: is: even more fake}'));

    const minPriceWei = ethers.utils.parseEther('0.1');
    const priceHex = minPriceWei.toHexString();
    const priceBytes = ethers.utils.hexZeroPad(priceHex, 32);

    try {
      const tx = await _styleNft.mint(
        100,
        fakeCid,
        priceStrategy.address,
        priceBytes,
        true
      );
      expect.fail('only curators should be allowed to mint');
    } catch (e: any) {
      expect(e.message).to.contain('only curators can mint styles');
    }
  });

  it('cannot mint a style with a likely bad cid', async function () {
    try {
      await mintStyle(styleNFT.connect(_curator), priceStrategy.address, {
        cid: 'this is not a cid'
      });
      expect.fail('a good cid must be provided during minting');
    } catch (e: any) {
      expect(e.message).to.contain('InvalidCID()');
    }
  });
  it('cannot call the internal methods from an external account', async function () {
    const _styleNft = styleNFT.connect(_owner);
    try {
      await _styleNft.incrementMintedPerStyle(1);
      expect.fail('was able to call an internal function');
    } catch (e: any) {
      expect(e.message).to.contain('only callable by Splice');
    }

    try {
      await _styleNft.decreaseAllowance(1, await _curator.getAddress());
      expect.fail('was able to call an internal function');
    } catch (e: any) {
      expect(e.message).to.contain('only callable by Splice');
    }
  });

  it('only allows the style owner to modify the sales status ', async function () {
    const _styleNft = styleNFT.connect(_user);
    try {
      await _styleNft.toggleSaleIsActive(1, true);
      expect.fail('only the style owner should be able to modify its settings');
    } catch (e: any) {
      expect(e.message).to.contain('NotControllingStyle');
    }
  });

  it('signals to be ready for minting', async function () {
    const _styleNft = styleNFT.connect(_curator);
    try {
      expect(await _styleNft.availableForPublicMinting(1)).to.equal(100);
      expect.fail(
        'availability shouldnt be signalled when sales is not active'
      );
    } catch (e: any) {
      expect(e.message).to.contain('SaleNotActive');
    }
    await _styleNft.toggleSaleIsActive(1, true);
    const isSaleActive = await _styleNft.isSaleActive(1);
    expect(isSaleActive).to.be.true;

    expect(await _styleNft.availableForPublicMinting(1)).to.equal(100);
  });

  it('allows minting of "cap" splices', async function () {
    const _styleNft = styleNFT.connect(_user);
    expect(await _styleNft.mintsLeft(1)).to.equal(100);
  });

  it('quotes the minting fee', async function () {
    const _styleNft = styleNFT.connect(_user);
    const fee = await _styleNft.quoteFee(testNft.address, 1);
    const weiFee = ethers.utils.formatUnits(fee, 'ether');

    expect(weiFee).to.equal('0.1');
  });

  it('downcasts the tokenURI token id correctly', async function () {
    const uri = await styleNFT.tokenURI(1);
    expect(uri).to.match(/^ipfs:\/\/(.*)\/metadata\.json$/);
  });

  it('fails when querying an unminted tokenURI', async function () {
    try {
      await styleNFT.tokenURI(10);
      expect.fail(
        'it mustnt be possible to query a token uri for a non existent token'
      );
    } catch (e: any) {
      expect(e.message).to.contain('nonexistent token');
    }
  });
});
