import { expect } from 'chai';
import { Signer, Wallet } from 'ethers';
import { ethers } from 'hardhat';
import {
  ChainWallet__factory,
  PaymentSplitterController,
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

describe('Fee Splitting', function () {
  let testNft: TestnetNFT;
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;
  let paymentSplitterController: PaymentSplitterController;

  let signers: Signer[];
  let _owner: Signer;
  let _user: Signer;
  let _styleMinter: Signer;

  let _platformBeneficiary: Wallet;
  let _artist: Wallet;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _user = signers[1];
    _styleMinter = signers[2];
  });

  before(async function () {
    _artist = Wallet.createRandom().connect(ethers.provider);
    _platformBeneficiary = Wallet.createRandom().connect(ethers.provider);
  });

  it('deploys nft & splice & mints a style', async function () {
    const {
      splice: _splice,
      styleNft: _styleNFT,
      paymentSplitterController: _ps
    } = await deploySplice();
    paymentSplitterController = _ps;

    testNft = await deployTestnetNFT();

    priceStrategy = await deployStaticPriceStrategy(_styleNFT.address);

    await _styleNFT.toggleStyleMinter(await _styleMinter.getAddress(), true);
    styleNFT = _styleNFT.connect(_styleMinter);

    await _splice.setPlatformBeneficiary(
      await _platformBeneficiary.getAddress()
    );
    splice = _splice;
  });

  it('can transfer a style', async function () {
    const styleId = await mintStyle(styleNFT, priceStrategy.address, {
      priceInEth: '0.1',
      saleIsActive: true,
      maxInputs: 1
    });
    const artistAddress = await _artist.getAddress();

    // this implicitly releases payment splitter funds but shouldnt revert!
    await styleNFT.transferFrom(
      await _styleMinter.getAddress(),
      artistAddress,
      styleId
    );

    expect((await styleNFT.balanceOf(artistAddress)).toNumber()).to.equal(1);
    expect(await styleNFT.ownerOf(1)).to.equal(artistAddress);
  });

  it('withdraws shared minting fee from payment splitter', async function () {
    const origin = await mintTestnetNFT(testNft, _user);
    await mintSplice(splice.connect(_user), testNft.address, origin, 1);

    expect((await _artist.getBalance()).toNumber()).to.equal(0);

    await paymentSplitterController['withdrawAll(address)'](_artist.address);
    expect(ethers.utils.formatEther(await _artist.getBalance())).to.equal(
      '0.085'
    );

    expect((await _platformBeneficiary.getBalance()).toNumber()).to.equal(0);
    await paymentSplitterController['withdrawAll(address)'](
      _platformBeneficiary.address
    );
    expect(
      ethers.utils.formatEther(await _platformBeneficiary.getBalance())
    ).to.equal('0.015');
  });

  it('can change the platform beneficiary', async function () {
    const newBeneficiary = Wallet.createRandom().connect(ethers.provider);

    try {
      await splice.setPlatformBeneficiary(ethers.constants.AddressZero);
      expect.fail('the platform beneficiary mustnt be zero');
    } catch (e: any) {
      expect(e.message).to.contain('must be a real address');
    }
    await splice.setPlatformBeneficiary(newBeneficiary.address);

    const styleId = await mintStyle(styleNFT, priceStrategy.address, {
      priceInEth: '0.2',
      saleIsActive: true,
      maxInputs: 1
    });

    const nftTokenId = await mintTestnetNFT(testNft, _user);
    await mintSplice(
      splice.connect(_user),
      testNft.address,
      nftTokenId,
      styleId
    );

    const settings = await styleNFT.getSettings(styleId);
    const splitter = ReplaceablePaymentSplitter__factory.connect(
      settings.paymentSplitter,
      _owner
    );
    await splitter['release(address)'](newBeneficiary.address);
    expect(
      ethers.utils.formatEther(await newBeneficiary.getBalance())
    ).to.equal('0.03');
  });

  it('withdraws funds before transferring a style token to a new owner', async function () {
    const artist = Wallet.createRandom().connect(ethers.provider);
    const buyer = Wallet.createRandom().connect(ethers.provider);
    await _styleMinter.sendTransaction({
      value: ethers.utils.parseEther('0.1'),
      to: artist.address
    });

    const styleId = await mintStyle(styleNFT, priceStrategy.address, {
      priceInEth: '0.1',
      saleIsActive: true,
      maxInputs: 1
    });

    await styleNFT.transferFrom(
      await _styleMinter.getAddress(),
      artist.address,
      styleId,
      {
        gasLimit: 3_000_000
      }
    );

    const nftTokenId = await mintTestnetNFT(testNft, _user);

    await mintSplice(
      splice.connect(_user),
      testNft.address,
      nftTokenId,
      styleId
    );

    expect(await styleNFT.ownerOf(styleId)).to.be.equal(artist.address);

    await styleNFT
      .connect(artist)
      .transferFrom(artist.address, buyer.address, styleId, {
        gasLimit: 3_000_000
      });

    const artistBalance = await artist.getBalance();

    expect(parseFloat(ethers.utils.formatEther(artistBalance))).to.be.gt(0.184);
    expect((await buyer.getBalance()).isZero()).to.be.true;
  });

  it('can update the artist share rate', async function () {
    await styleNFT.connect(_owner).updateArtistShare(9000);
    const artist = Wallet.createRandom().connect(ethers.provider);
    const styleId = await mintStyle(styleNFT, priceStrategy.address, {
      priceInEth: '1.0'
    });
    styleNFT.transferFrom(
      await _styleMinter.getAddress(),
      artist.address,
      styleId
    );
    const nftTokenId = await mintTestnetNFT(testNft, _user);

    await mintSplice(
      splice.connect(_user),
      testNft.address,
      nftTokenId,
      styleId
    );
    await paymentSplitterController
      .connect(_styleMinter)
      ['withdrawAll(address)'](artist.address);
    expect(ethers.utils.formatEther(await artist.getBalance())).to.be.equal(
      '0.9'
    );
  });

  it('signals 10% royalties to the style payment splitter', async function () {
    const nftTokenId = await mintTestnetNFT(testNft.connect(_user), _user);
    const spliceTokenId = await mintSplice(
      splice.connect(_user),
      testNft.address,
      nftTokenId,
      1
    );

    const salePrice = ethers.utils.parseEther('1');
    const royaltyInfo = await splice.royaltyInfo(spliceTokenId, salePrice);
    expect(ethers.utils.formatUnits(royaltyInfo.royaltyAmount)).to.equal('0.1');
    const settings = await styleNFT.getSettings(1);
    const ps = settings.paymentSplitter;

    const royaltyReceiver = royaltyInfo.receiver;
    expect(royaltyReceiver).to.equal(ps);
  });

  it('a beneficiary can be a payable contract', async function () {
    const ChainWallet = (await ethers.getContractFactory(
      'ChainWallet'
    )) as ChainWallet__factory;
    const wallet = await ChainWallet.deploy();

    const styleId = await mintStyle(styleNFT, priceStrategy.address, {
      priceInEth: '1.0'
    });

    await styleNFT.transferFrom(
      await _styleMinter.getAddress(),
      wallet.address,
      styleId
    );

    const nft = await mintTestnetNFT(testNft, _user);
    await mintSplice(splice.connect(_user), testNft.address, nft, styleId);

    await paymentSplitterController['withdrawAll(address)'](wallet.address);
    const walletBalance = await ethers.provider.getBalance(wallet.address);
    expect(ethers.utils.formatEther(walletBalance)).to.be.equal('0.9');
  });
});
