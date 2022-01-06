import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import {
  ChainWallet__factory,
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT,
  SpliceStyleNFT__factory,
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

  let signers: Signer[];
  let _owner: Signer;
  let _user: Signer;
  let _platformBeneficiary: Signer;
  let _anotherArtist: Signer;
  let _partnerBeneficiary: Signer;
  let _styleMinter: Signer;
  let _seller: Signer;
  let _artist: Signer;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _user = signers[1];
    _platformBeneficiary = signers[2];
    _anotherArtist = signers[15];
    _partnerBeneficiary = signers[16];
    _styleMinter = signers[17];
    _seller = signers[18];
    _artist = signers[19];
  });

  it('deploys nft & splice & mints a style', async function () {
    splice = await deploySplice();
    testNft = await deployTestnetNFT();
    const styleNftAddress = await splice.styleNFT();
    const _styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, _owner);

    priceStrategy = await deployStaticPriceStrategy(styleNftAddress);

    const styleMinterAddress = await _styleMinter.getAddress();
    await _styleNFT.toggleStyleMinter(styleMinterAddress, true);
    styleNFT = _styleNFT.connect(_styleMinter);

    const styleId = await mintStyle(styleNFT, priceStrategy.address, {
      priceInEth: '0.1',
      saleIsActive: true,
      maxInputs: 1
    });
    const artistAddress = await _artist.getAddress();
    await styleNFT.transferFrom(styleMinterAddress, artistAddress, styleId);

    expect((await styleNFT.balanceOf(artistAddress)).toNumber()).to.equal(1);
    expect(await styleNFT.ownerOf(1)).to.equal(artistAddress);
    await splice.setPlatformBeneficiary(
      await _platformBeneficiary.getAddress()
    );
  });

  it('withdraws shared funds from escrow', async function () {
    const artistAddress = await _artist.getAddress();
    const benefAddress = await _platformBeneficiary.getAddress();

    const origin = await mintTestnetNFT(testNft, _user);
    await mintSplice(splice.connect(_user), testNft.address, origin, 1);

    const artistCollectedFees = await splice.escrowedBalanceOf(artistAddress);

    const artistEth = ethers.utils.formatUnits(artistCollectedFees, 'ether');
    const expected = 0.1 * 0.85; //1 mint for 0.1, 1 mint for 0.2 times 85% share
    expect(expected.toString()).to.equal(artistEth);

    const curBalance = await _artist.getBalance();
    await (await splice.connect(_artist).claimShares(artistAddress)).wait();
    const newBalance = await _artist.getBalance();

    const diff = parseFloat(
      ethers.utils.formatUnits(newBalance.sub(curBalance), 'ether')
    );
    expect(expected - diff).to.be.lessThan(0.001); //gas fees ;)

    const benefCurBalance = await _platformBeneficiary.getBalance();
    await (await splice.claimShares(benefAddress)).wait();
    const benefNewBalance = await _platformBeneficiary.getBalance();
    const benefDiff = parseFloat(
      ethers.utils.formatUnits(benefNewBalance.sub(benefCurBalance), 'ether')
    );
    const benefExpected = 0.1 * 0.15;
    expect(benefExpected - benefDiff).to.be.lessThan(0.001);
  });

  it('can change the platform beneficiary', async function () {
    const signer13 = await signers[13].getAddress();
    expect((await splice.escrowedBalanceOf(signer13)).isZero()).to.be.true;

    try {
      await splice.setPlatformBeneficiary(ethers.constants.AddressZero);
      expect.fail('the platform beneficiary mustnt be zero');
    } catch (e: any) {
      expect(e.message).to.contain('must be a real address');
    }

    await splice.setPlatformBeneficiary(signer13);

    const nftTokenId = await mintTestnetNFT(testNft, _user);

    await mintSplice(splice.connect(_user), testNft.address, nftTokenId, 1);

    const beneficiaryExpected = 0.1 * 0.15;
    const beneficiaryShares = await splice.escrowedBalanceOf(signer13);
    expect(ethers.utils.formatUnits(beneficiaryShares, 'ether')).to.be.equal(
      beneficiaryExpected.toString()
    );
  });

  it('reallocates funds to new owners of a style token', async function () {
    const _artistAddress = await _artist.getAddress();
    const _anotherArtistAddress = await _anotherArtist.getAddress();

    const oldArtistShares = await splice.escrowedBalanceOf(_artistAddress);

    await (
      await styleNFT
        .connect(_artist)
        .transferFrom(_artistAddress, _anotherArtistAddress, 1)
    ).wait();

    expect(await styleNFT.ownerOf(1)).to.be.equal(_anotherArtistAddress);

    const nftTokenId = await mintTestnetNFT(testNft, _user);
    await mintSplice(splice.connect(_user), testNft.address, nftTokenId, 1);

    expect(await splice.escrowedBalanceOf(_artistAddress)).to.equal(
      oldArtistShares
    );

    const anotherArtistShares = await splice.escrowedBalanceOf(
      _anotherArtistAddress
    );
    const expected = 0.1 * 0.85;
    expect(ethers.utils.formatUnits(anotherArtistShares, 'ether')).to.be.equal(
      expected.toString()
    );

    //note: anybody may invoke the claimShares method on behalf of anyone else.
    await splice.claimShares(_anotherArtistAddress);
    expect(
      await (await splice.escrowedBalanceOf(_anotherArtistAddress)).isZero()
    ).to.be.true;
  });

  it('can update the artist share rate', async function () {
    await splice.updateArtistShare(90);
    const anotherArtist = signers[15];
    const _anotherArtistAddress = await anotherArtist.getAddress();

    const nftTokenId = await mintTestnetNFT(testNft, _user);

    await mintSplice(splice.connect(_user), testNft.address, nftTokenId, 1);

    const anotherArtistShares = await splice.escrowedBalanceOf(
      _anotherArtistAddress
    );
    const expected = (0.1 * 0.9).toFixed(2);
    expect(ethers.utils.formatUnits(anotherArtistShares, 'ether')).to.be.equal(
      expected
    );
    await splice.claimShares(_anotherArtistAddress);
    expect(
      (await splice.escrowedBalanceOf(_anotherArtistAddress)).toNumber()
    ).to.equal(0);

    await (
      await styleNFT
        .connect(anotherArtist)
        .transferFrom(_anotherArtistAddress, await _artist.getAddress(), 1)
    ).wait();
  });

  it('can not withdraw from escrow when paused', async function () {
    await splice.pause();

    try {
      await (
        await splice.claimShares(await _platformBeneficiary.getAddress())
      ).wait();
      expect.fail('it shouldnt be possible to withdraw shares when paused');
    } catch (e: any) {
      expect(e.message).to.contain('Pausable: paused');
    } finally {
      await splice.unpause();
    }
  });

  it('signals 10% royalties to the style nft owner', async function () {
    const artistAddress = await _artist.getAddress();

    const nftTokenId = await mintTestnetNFT(testNft.connect(_seller), _seller);
    const spliceTokenId = await mintSplice(
      splice.connect(_seller),
      testNft.address,
      nftTokenId,
      1
    );
    const salePrice = ethers.utils.parseEther('1');
    const royaltyInfo = await splice.royaltyInfo(spliceTokenId, salePrice);
    expect(ethers.utils.formatUnits(royaltyInfo.royaltyAmount)).to.equal('0.1');

    const royaltyReceiver = royaltyInfo.receiver;
    expect(royaltyReceiver).to.equal(artistAddress);
  });

  it('the platform beneficiary can be a payable contract', async function () {
    const ChainWallet = (await ethers.getContractFactory(
      'ChainWallet'
    )) as ChainWallet__factory;
    const wallet = await ChainWallet.deploy();

    splice.setPlatformBeneficiary(wallet.address);

    const nft = await mintTestnetNFT(testNft, _user);
    await mintSplice(splice.connect(_user), testNft.address, nft, 1);

    const walletShare = await splice.escrowedBalanceOf(wallet.address);
    expect(ethers.utils.formatUnits(walletShare, 'ether')).to.be.equal('0.01');

    await wallet.withdrawShares(splice.address);

    const walletBalance = await wallet.provider.getBalance(wallet.address);
    expect(ethers.utils.formatUnits(walletBalance, 'ether')).to.be.equal(
      '0.01'
    );
  });
});
