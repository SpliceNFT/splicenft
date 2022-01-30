import { expect } from 'chai';
import { Signer, Wallet } from 'ethers';
import { ethers, network } from 'hardhat';
import {
  ReplaceablePaymentSplitter__factory,
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT
} from '../typechain';
import {
  deploySplice,
  deployStaticPriceStrategy,
  deployTestnetNFT
} from './lib/deployContracts';
import { mintSplice, mintStyle, mintTestnetNFT } from './lib/helpers';

const FOREVER = new Date('2100-12-31 12:00:00').getTime() / 1000;

describe('Partnerships', function () {
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;

  let signers: Signer[];
  let _owner: Signer;
  let _user: Signer;
  let _platformBeneficiary: Wallet;
  let _styleMinter: Signer;

  before(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _user = signers[1];
    _styleMinter = signers[19];

    const { splice: _splice, styleNft: _styleNft } = await deploySplice();
    splice = _splice;

    priceStrategy = await deployStaticPriceStrategy(_styleNft.address);

    const styleMinterAddress = await _styleMinter.getAddress();
    await _styleNft.toggleStyleMinter(styleMinterAddress, true);
    styleNFT = _styleNft.connect(_styleMinter);

    _platformBeneficiary = Wallet.createRandom().connect(ethers.provider);
    await splice.setPlatformBeneficiary(_platformBeneficiary.address);
  });

  it('active partnerships share fees with the partners', async function () {
    const ONE_DAY_AND_A_BIT = 60 * 60 * 24 + 60;
    const partnerBeneficiary = ethers.Wallet.createRandom().connect(
      ethers.provider
    );
    const artist = Wallet.createRandom().connect(ethers.provider);

    const styleId = await mintStyle(styleNFT, priceStrategy.address, {
      maxInputs: 1,
      priceInEth: '1',
      saleIsActive: false,
      artist: artist.address,
      partner: partnerBeneficiary.address
    });

    const partnerNft = await deployTestnetNFT();
    const expires = new Date().getTime() + ONE_DAY_AND_A_BIT + 1;

    await (
      await styleNFT
        .connect(_styleMinter)
        .enablePartnership([partnerNft.address], styleId, expires, false)
    ).wait();

    const settings = await styleNFT.getSettings(styleId);
    const paymentSplitter = ReplaceablePaymentSplitter__factory.connect(
      settings.paymentSplitter,
      ethers.provider
    ).connect(_owner);

    expect((await paymentSplitter.shares(artist.address)).toNumber()).to.equal(
      8500
    );

    expect(
      (await paymentSplitter.shares(partnerBeneficiary.address)).toNumber()
    ).to.equal(750);

    expect(
      (await paymentSplitter.shares(_platformBeneficiary.address)).toNumber()
    ).to.equal(750);

    const nft = await mintTestnetNFT(partnerNft, _user);

    await styleNFT.toggleSaleIsActive(styleId, true);

    await mintSplice(splice.connect(_user), partnerNft.address, nft, styleId);

    //since this is a nonexclusive partnership, other origins are allowed can mint
    const someCollection = await deployTestnetNFT();
    const someNft = await mintTestnetNFT(someCollection, _user);

    await mintSplice(
      splice.connect(_user),
      someCollection.address,
      someNft,
      styleId
    );

    await paymentSplitter['release(address)'](artist.address);
    await paymentSplitter['release(address)'](partnerBeneficiary.address);
    await paymentSplitter['release(address)'](_platformBeneficiary.address);

    expect(ethers.utils.formatEther(await artist.getBalance())).to.be.equal(
      '1.7'
    );
    expect(
      ethers.utils.formatEther(await partnerBeneficiary.getBalance())
    ).to.be.equal('0.15');
    expect(
      ethers.utils.formatEther(await _platformBeneficiary.getBalance())
    ).to.be.equal('0.15');
  });

  it('can be constrained to exclusive, unlimited partnerships', async function () {
    const collection1 = await deployTestnetNFT();
    const collection2 = await deployTestnetNFT();
    const collection3 = await deployTestnetNFT();
    const partnerBeneficiary = ethers.Wallet.createRandom().connect(
      ethers.provider
    );

    const styleTokenId = await mintStyle(styleNFT, priceStrategy.address, {
      maxInputs: 2,
      priceInEth: '1',
      saleIsActive: true,
      partner: partnerBeneficiary.address
    });

    await (
      await styleNFT.enablePartnership(
        [collection1.address, collection2.address],
        styleTokenId,
        FOREVER,
        true
      )
    ).wait();

    const token1 = await mintTestnetNFT(collection1, _user);
    const token2 = await mintTestnetNFT(collection2, _user);
    const token3 = await mintTestnetNFT(collection3, _user);

    await mintSplice(
      splice.connect(_user),
      collection1.address,
      token1,
      styleTokenId
    );

    await mintSplice(
      splice.connect(_user),
      [collection1.address, collection2.address],
      [token1, token2],
      styleTokenId
    );

    try {
      await mintSplice(
        splice.connect(_user),
        [collection1.address, collection3.address],
        [token1, token3],
        styleTokenId
      );
      expect.fail(
        'users mustnt be able to use another collection on an exclusive partnership'
      );
    } catch (e: any) {
      expect(e.message).to.contain('OriginNotAllowed("exclusive partnership")');
    }
  });

  it('cannot mint from other origins on an exclusive collection', async () => {
    const ONE_DAY_AND_A_BIT = 60 * 60 * 24 + 60;
    const collection1 = await deployTestnetNFT();
    const collection2 = await deployTestnetNFT();
    const anotherNft = await deployTestnetNFT();

    const partnerBeneficiary = ethers.Wallet.createRandom().connect(
      ethers.provider
    );

    const goodToken = await mintTestnetNFT(collection1, _user);
    const badToken = await mintTestnetNFT(anotherNft, _user);

    const styleTokenId = await mintStyle(styleNFT, priceStrategy.address, {
      maxInputs: 2,
      priceInEth: '1',
      saleIsActive: true,
      partner: partnerBeneficiary.address
    });

    const block = await ethers.provider.getBlock(
      await ethers.provider.getBlockNumber()
    );

    await styleNFT.enablePartnership(
      [collection1.address, collection2.address],
      styleTokenId,
      block.timestamp + ONE_DAY_AND_A_BIT,
      true
    );

    try {
      await mintSplice(
        splice.connect(_user),
        anotherNft.address,
        badToken,
        styleTokenId
      );

      expect.fail('should throw on constrained collection');
    } catch (e: any) {
      expect(e.message).to.contain('OriginNotAllowed("exclusive partnership")');
    }

    try {
      await mintSplice(
        splice.connect(_user),
        [collection1.address, anotherNft.address],
        [goodToken, badToken],
        styleTokenId
      );

      expect.fail('should not allow exclusive partnerships to mix with others');
    } catch (e: any) {
      expect(e.message).to.contain('OriginNotAllowed("exclusive partnership")');
    }

    //partnership expires...

    await network.provider.send('evm_increaseTime', [ONE_DAY_AND_A_BIT + 3600]);
    await network.provider.send('evm_mine');

    await mintSplice(
      splice.connect(_user),
      [collection1.address, anotherNft.address],
      [goodToken, badToken],
      styleTokenId
    );
  });

  it('cannot start a partnership once minting has started', async () => {
    const collection = await deployTestnetNFT();
    const nft = await mintTestnetNFT(collection, _user);
    const partnerBeneficiary = ethers.Wallet.createRandom();

    const styleTokenId = await mintStyle(styleNFT, priceStrategy.address, {
      maxInputs: 1,
      priceInEth: '1',
      saleIsActive: true,
      partner: partnerBeneficiary.address
    });

    await mintSplice(
      splice.connect(_user),
      collection.address,
      nft,
      styleTokenId
    );

    try {
      await styleNFT.enablePartnership(
        [collection.address],
        styleTokenId,
        FOREVER,
        true
      );

      expect.fail(
        'a partnership mustnt be established after minting has started'
      );
    } catch (e: any) {
      expect(e.message).contains(
        'cant add a partnership after minting started'
      );
    }
  });
});
