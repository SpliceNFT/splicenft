import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import {
  ReplaceablePaymentSplitter__factory,
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT,
  TestnetNFT
} from '../typechain';
import {
  deploySplice,
  deployStaticPriceStrategy,
  deployTestnetNFT
} from './lib/deployContracts';
import { mintSplice, mintStyle, mintTestnetNFT } from './lib/helpers';

describe('Royalties', function () {
  let testNft: TestnetNFT;
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;

  let signers: Signer[];
  let _styleMinter: Signer;
  let _artist: Signer;

  let _marketplace: Signer;
  let _seller: Signer;
  let _owner: Signer;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _marketplace = signers[10];
    _styleMinter = signers[17];
    _artist = signers[18];
    _seller = signers[19];
  });

  it('deploys nft & splice & mints a style', async function () {
    const { splice: _splice, styleNft: _styleNft } = await deploySplice();
    splice = _splice;
    testNft = await deployTestnetNFT();

    priceStrategy = await deployStaticPriceStrategy(_styleNft.address);

    const styleMinterAddress = await _styleMinter.getAddress();
    await _styleNft.toggleStyleMinter(styleMinterAddress, true);
    styleNFT = _styleNft.connect(_styleMinter);

    const styleId = await mintStyle(styleNFT, priceStrategy.address);
    const artistAddress = await _artist.getAddress();
    await styleNFT.transferFrom(styleMinterAddress, artistAddress, styleId);

    expect((await styleNFT.balanceOf(artistAddress)).toNumber()).to.equal(1);
    expect(await styleNFT.ownerOf(1)).to.equal(artistAddress);
  });

  it('signals royalties', async function () {
    await splice.updateRoyalties(5);

    const _nft = testNft.connect(_seller);
    const nftTokenId = await mintTestnetNFT(_nft, _seller);

    const _splice = splice.connect(_seller);
    const spliceTokenId = await mintSplice(
      _splice,
      testNft.address,
      nftTokenId,
      1
    );

    const salePrice = ethers.utils.parseEther('1');
    const royaltyInfo = await splice.royaltyInfo(spliceTokenId, salePrice);
    expect(ethers.utils.formatEther(royaltyInfo.royaltyAmount)).to.equal(
      '0.05'
    );

    const royaltyReceiver = royaltyInfo.receiver;
    const settings = await styleNFT.getSettings(1);
    expect(royaltyReceiver).to.equal(settings.paymentSplitter);
  });

  it('updates payment splitters to the next style owner', async () => {
    const styleBuyer = ethers.Wallet.createRandom().connect(ethers.provider);

    await styleNFT
      .connect(_artist)
      .transferFrom(await _artist.getAddress(), styleBuyer.address, 1);

    const spliceTokenId = ethers.BigNumber.from('0x0000000100000001');
    const royaltyInfo = await splice.royaltyInfo(
      spliceTokenId,
      ethers.utils.parseEther('1')
    );

    const settings = await styleNFT.getSettings(1);
    expect(royaltyInfo.receiver).to.equal(settings.paymentSplitter);

    const splitter = ReplaceablePaymentSplitter__factory.connect(
      royaltyInfo.receiver,
      _owner
    );

    await _marketplace.sendTransaction({
      to: royaltyInfo.receiver,
      value: ethers.utils.parseEther('0.1')
    });

    await splitter['release(address)'](styleBuyer.address);
    expect(ethers.utils.formatEther(await styleBuyer.getBalance())).to.be.equal(
      '0.085'
    );
  });

  it('cannot set royalties higher than 10%', async () => {
    const _splice = splice.connect(_owner);
    try {
      await _splice.updateRoyalties(11);
      expect.fail('was able to set royalties higher than 10%');
    } catch (e: any) {
      expect(e.message).contains('royalties must never exceed 10%');
    }
  });
});
