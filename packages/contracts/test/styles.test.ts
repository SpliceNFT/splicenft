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
  let _styleMinter: Signer;
  let _user: Signer;
  let _owner: Signer;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _styleMinter = signers[18];
    _user = signers[19];
  });

  it('deploys nft and splice', async function () {
    splice = await deploySplice();
    testNft = await deployTestnetNFT();
    const styleNftAddress = await splice.styleNFT();
    styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, _owner);
    const _priceStrategy = await deployStaticPriceStrategy(styleNftAddress);
    priceStrategy = _priceStrategy.connect(_styleMinter);
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

  it('can allow a new style minter', async function () {
    styleNFT.connect(_owner);
    const styleMinterAddress = await _styleMinter.getAddress();
    await (await styleNFT.toggleStyleMinter(styleMinterAddress, true)).wait();

    const res = await styleNFT.isStyleMinter(styleMinterAddress);
    expect(res).to.be.true;
  });

  it('can mint a new style', async function () {
    const styleMinterAddress = await _styleMinter.getAddress();

    const _styleNft = styleNFT.connect(_styleMinter);
    expect(await _styleNft.signer.getAddress()).to.equal(styleMinterAddress);

    const res = await _styleNft.isStyleMinter(styleMinterAddress);
    expect(res).to.be.true;

    const fakeCid = await ipfsHashOf(Buffer.from('{this: is: fake}'));

    const tx = await _styleNft.mint(
      100,
      fakeCid,
      priceStrategy.address,
      false,
      1
    );
    const receipt = await tx.wait();

    const transferEvent = receipt.events?.find(
      (e: Event) => e.event === 'Transfer'
    );

    expect(transferEvent).to.not.be.undefined;
    const tokenId = (transferEvent as TransferEvent).args.tokenId;
    expect(tokenId.toNumber()).to.equal(1);

    priceStrategy.setPrice(tokenId, ethers.utils.parseEther('0.1'));

    const metadataUri = await _styleNft.tokenURI(tokenId);
    expect(metadataUri).to.equal(`ipfs://${fakeCid}/metadata.json`);
  });

  it('only style minters can mint styles', async function () {
    const _styleNft = styleNFT.connect(_user);

    const fakeCid = await ipfsHashOf(Buffer.from('{this: is: even more fake}'));

    try {
      const tx = await _styleNft.mint(
        100,
        fakeCid,
        priceStrategy.address,
        true,
        1
      );
      expect.fail('only style minters should be allowed to mint');
    } catch (e: any) {
      expect(e.message).to.contain('not allowed to mint styles');
    }
  });

  it('cannot mint a style with a likely bad cid', async function () {
    try {
      await mintStyle(styleNFT.connect(_styleMinter), priceStrategy.address, {
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
      await _styleNft.decreaseAllowance(1, await _styleMinter.getAddress());
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
    const _styleNft = styleNFT.connect(_styleMinter);
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
    const fee = await _styleNft.quoteFee(1, [testNft.address], [1]);
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

  it('allows a style owner to update its minting price', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const styleMinterAddress = await _styleMinter.getAddress();
    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address, {
      saleIsActive: false,
      maxInputs: 1
    });

    priceStrategy.setPrice(styleTokenId, ethers.utils.parseEther('0.25'));

    const fee = await _styleNft.quoteFee(styleTokenId, [testNft.address], [1]);
    const weiFee = ethers.utils.formatUnits(fee, 'ether');
    expect(weiFee).to.equal('0.25');

    await priceStrategy.setPrice(styleTokenId, ethers.utils.parseEther('0.3'));

    const newFee = await _styleNft.quoteFee(
      styleTokenId,
      [testNft.address],
      [1]
    );

    expect(ethers.utils.formatUnits(newFee, 'ether')).to.equal('0.3');
    const newOwner = signers[10];
    const newOwnerAddress = await newOwner.getAddress();
    await _styleNft.transferFrom(
      styleMinterAddress,
      newOwnerAddress,
      styleTokenId
    );
    try {
      await priceStrategy.setPrice(
        styleTokenId,
        ethers.utils.parseEther('0.05')
      );
      expect.fail('only the current owner must be able to set the minting fee');
    } catch (e: any) {
      expect(e.message).to.contain('must own the style');
    }

    const _priceStrategy = priceStrategy.connect(newOwner);
    await _priceStrategy.setPrice(
      styleTokenId,
      ethers.utils.parseEther('0.77')
    );

    const newFee2 = await _styleNft.quoteFee(
      styleTokenId,
      [testNft.address],
      [1]
    );

    expect(ethers.utils.formatUnits(newFee2, 'ether')).to.equal('0.77');
  });
});
