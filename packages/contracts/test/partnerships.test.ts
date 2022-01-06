import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers, network } from 'hardhat';
import {
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT,
  SpliceStyleNFT__factory
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
  let _platformBeneficiary: Signer;
  let _styleMinter: Signer;

  let partnerStyleId: number;

  before(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _user = signers[1];
    _platformBeneficiary = signers[2];
    _styleMinter = signers[19];
  });

  beforeEach(async function () {
    splice = await deploySplice();
    const styleNftAddress = await splice.styleNFT();
    const _styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, _owner);
    priceStrategy = await deployStaticPriceStrategy(styleNftAddress);

    const styleMinterAddress = await _styleMinter.getAddress();
    await _styleNFT.toggleStyleMinter(styleMinterAddress, true);
    styleNFT = _styleNFT.connect(_styleMinter);

    await splice.setPlatformBeneficiary(
      await _platformBeneficiary.getAddress()
    );

    partnerStyleId = await mintStyle(styleNFT, priceStrategy.address, {
      maxInputs: 1,
      priceInEth: '1',
      saleIsActive: true
    });
  });

  it('active partnerships share mint fees with the partners', async function () {
    const ONE_DAY_AND_A_BIT = 60 * 60 * 24 + 60;

    const partnerNft = await deployTestnetNFT();
    const expires = new Date().getTime() + ONE_DAY_AND_A_BIT + 1;
    const partnerBeneficiary = ethers.Wallet.createRandom();

    await (
      await styleNFT.addCollectionPartnership(
        [partnerNft.address],
        partnerStyleId,
        partnerBeneficiary.address,
        expires,
        false
      )
    ).wait();

    const nft = await mintTestnetNFT(partnerNft, _user);
    await mintSplice(
      splice.connect(_user),
      partnerNft.address,
      nft,
      partnerStyleId
    );
    const balStyleOwner = ethers.utils.formatEther(
      await splice.escrowedBalanceOf(await _styleMinter.getAddress())
    );
    const balPlatform = ethers.utils.formatEther(
      await splice.escrowedBalanceOf(await _platformBeneficiary.getAddress())
    );
    const balPartner = ethers.utils.formatEther(
      await splice.escrowedBalanceOf(partnerBeneficiary.address)
    );

    expect(balStyleOwner).to.be.equal('0.85');
    expect(balPlatform).to.be.equal('0.075');
    expect(balPartner).to.be.equal('0.075');

    //since this is a nonexclusive partnership, other origins are allowed can mint
    const someCollection = await deployTestnetNFT();
    const someNft = await mintTestnetNFT(someCollection, _user);
    await mintSplice(
      splice.connect(_user),
      someCollection.address,
      someNft,
      partnerStyleId
    );
    const balStyleOwner2 = ethers.utils.formatEther(
      await splice.escrowedBalanceOf(await _styleMinter.getAddress())
    );
    const balPlatform2 = ethers.utils.formatEther(
      await splice.escrowedBalanceOf(await _platformBeneficiary.getAddress())
    );
    const balPartner2 = ethers.utils.formatEther(
      await splice.escrowedBalanceOf(partnerBeneficiary.address)
    );

    expect(balStyleOwner2).to.be.equal('1.7');
    expect(balPlatform2).to.be.equal('0.225');
    expect(balPartner2).to.be.equal('0.075');
  });

  it('can be constrained to exclusive, unlimited partnerships', async function () {
    const collection1 = await deployTestnetNFT();
    const collection2 = await deployTestnetNFT();
    const partnerBeneficiary = ethers.Wallet.createRandom();

    const styleTokenId = await mintStyle(styleNFT, priceStrategy.address, {
      maxInputs: 2,
      priceInEth: '1',
      saleIsActive: true
    });

    await (
      await styleNFT.addCollectionPartnership(
        [collection1.address, collection2.address],
        styleTokenId,
        partnerBeneficiary.address,
        FOREVER,
        true
      )
    ).wait();

    const token1 = await mintTestnetNFT(collection1, _user);
    const token2 = await mintTestnetNFT(collection2, _user);

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
  });

  it('cannot mint from other origins on an exclusive collection', async () => {
    const ONE_DAY_AND_A_BIT = 60 * 60 * 24 + 60;
    const collection1 = await deployTestnetNFT();
    const collection2 = await deployTestnetNFT();
    const anotherNft = await deployTestnetNFT();

    const goodToken = await mintTestnetNFT(collection1, _user);
    const badToken = await mintTestnetNFT(anotherNft, _user);

    const styleTokenId = await mintStyle(styleNFT, priceStrategy.address, {
      maxInputs: 2,
      priceInEth: '1',
      saleIsActive: true
    });
    const partnerBeneficiary = ethers.Wallet.createRandom();
    const block = await ethers.provider.getBlock(
      await ethers.provider.getBlockNumber()
    );
    const expires = block.timestamp + ONE_DAY_AND_A_BIT;

    await (
      await styleNFT.addCollectionPartnership(
        [collection1.address, collection2.address],
        styleTokenId,
        partnerBeneficiary.address,
        expires,
        true
      )
    ).wait();

    try {
      await mintSplice(
        splice.connect(_user),
        anotherNft.address,
        badToken,
        styleTokenId
      );

      expect.fail('should throw on constrained collection');
    } catch (e: any) {
      expect(e.message).to.contain(
        'collection not part of exclusive partnership'
      );
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
      expect(e.message).to.contain(
        'collection not part of exclusive partnership'
      );
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
});
