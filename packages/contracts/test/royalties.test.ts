import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import {
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

describe('Royalties', function () {
  let testNft: TestnetNFT;
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;

  let signers: Signer[];
  let _styleMinter: Signer;
  let _artist: Signer;
  let _styleBuyer: Signer;
  let _buyer: Signer;
  let _seller: Signer;
  let _owner: Signer;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _buyer = signers[9];
    _styleBuyer = signers[16];
    _styleMinter = signers[17];
    _artist = signers[18];
    _seller = signers[19];
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

    const styleId = await mintStyle(styleNFT, priceStrategy.address);
    const artistAddress = await _artist.getAddress();
    await styleNFT.transferFrom(styleMinterAddress, artistAddress, styleId);

    expect((await styleNFT.balanceOf(artistAddress)).toNumber()).to.equal(1);
    expect(await styleNFT.ownerOf(1)).to.equal(artistAddress);
  });

  it('signals royalties', async function () {
    const artistAddress = await _artist.getAddress();

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
    expect(ethers.utils.formatUnits(royaltyInfo.royaltyAmount)).to.equal('0.1');

    const royaltyReceiver = royaltyInfo.receiver;
    expect(royaltyReceiver).to.equal(artistAddress);
  });

  it('sends royalties to the current style owner', async () => {
    const _splice = splice.connect(_seller);
    const _styleNFT = styleNFT.connect(_artist);
    const artistAddress = await _artist.getAddress();
    const styleBuyerAddress = await _styleBuyer.getAddress();

    await _styleNFT.transferFrom(artistAddress, styleBuyerAddress, 1);
    const spliceTokenId = ethers.BigNumber.from('0x0000000100000001');
    const royaltyInfo = await splice.royaltyInfo(
      spliceTokenId,
      ethers.utils.parseEther('1')
    );
    expect(royaltyInfo.receiver).to.equal(styleBuyerAddress);
  });

  it('cannot increase royalties higher than 10%', async () => {
    const _splice = splice.connect(_owner);
    try {
      await _splice.updateRoyalties(11);
      expect.fail('was able to set royalties higher than 10%');
    } catch (e: any) {
      expect(e.message).contains('royalties must never exceed 10%');
    }
  });
});
