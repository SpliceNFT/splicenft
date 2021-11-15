import { expect } from 'chai';
import { Signer, Event, ContractReceipt } from 'ethers';
import { ethers } from 'hardhat';

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
import {
  mintStyle,
  mintTestnetNFT,
  tokenIdToStyleAndToken
} from './lib/helpers';

describe('Splice', function () {
  let testNft: TestnetNFT;
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;

  let signers: Signer[];
  let _artist: Signer;
  let _user: Signer;
  let _owner: Signer;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _artist = signers[18];
    _user = signers[19];
  });

  it('deploys nft, splice & creates a style', async function () {
    splice = await deploySplice();
    testNft = await deployTestnetNFT();
    priceStrategy = await deployStaticPriceStrategy();
    const styleNftAddress = await splice.styleNFT();
    styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, signers[0]);

    const artistAddress = await _artist.getAddress();
    await (await styleNFT.allowArtist(artistAddress)).wait();

    const _styleNft = styleNFT.connect(_artist);
    await mintStyle(_styleNft, priceStrategy.address, { saleIsActive: false });
  });

  it('gets an nft on the test collection', async function () {
    const nftTokenId = await mintTestnetNFT(testNft, _user);
    expect(nftTokenId).to.eq(1);
  });

  it('quotes the minting fee', async function () {
    const fee = await splice.quote(testNft.address, 1);
    const weiFee = ethers.utils.formatUnits(fee, 'ether');
    expect(weiFee).to.equal('0.1');
  });

  it('reverts when youre not sending sufficient fees along', async function () {
    const _splice = splice.connect(_user);

    try {
      await (
        await _splice.mint(testNft.address, 1, 1, [], ethers.constants.HashZero)
      ).wait();
      expect.fail('shouldnt work because no fees have been sent along');
    } catch (e: any) {
      expect(e.message).contains('InsufficientFees');
    }
  });

  it('reverts when sales is not active', async function () {
    const _splice = splice.connect(_user);
    const fee = await splice.quote(testNft.address, 1);
    try {
      await (
        await _splice.mint(
          testNft.address,
          1,
          1,
          [],
          ethers.constants.HashZero,
          {
            value: fee
          }
        )
      ).wait();
      expect.fail('should revert because sale on that style isnt active');
    } catch (e: any) {
      expect(e.message).contains('SaleNotActive');
    } finally {
      const _styleNFT = styleNFT.connect(_artist);
      //Activate sales on that style.
      await _styleNFT.toggleSaleIsActive(1, true);
    }
  });

  it('mints a splice from an origin', async function () {
    const _splice = splice.connect(_user);
    const fee = await splice.quote(testNft.address, 1);
    const receipt = await (
      await _splice.mint(testNft.address, 1, 1, [], ethers.constants.HashZero, {
        value: fee
      })
    ).wait();

    const transferEvent = receipt.events?.find(
      (e: Event) => e.event === 'Transfer'
    );

    expect(transferEvent).to.not.be.undefined;
    const combinedTokenId = (transferEvent as TransferEvent).args.tokenId;

    const { token_id, style_token_id } =
      tokenIdToStyleAndToken(combinedTokenId);

    expect(token_id).to.equal(1);
    expect(style_token_id).to.equal(1);
  });

  it('cannot mint another splice from the same origin and style', async function () {
    const _splice = splice.connect(_user);
    const fee = await _splice.quote(testNft.address, 1);
    try {
      await _splice.mint(testNft.address, 1, 1, [], ethers.constants.HashZero, {
        value: fee
      });

      expect.fail('contract should fail because provenance has been used');
    } catch (e: any) {
      expect(e.message).contains('ProvenanceAlreadyUsed');
    }
  });

  it('can mint another splice from the same origin and different style', async function () {
    const _splice = splice.connect(_user);

    await mintStyle(styleNFT.connect(_artist), priceStrategy.address, {
      priceInEth: '0.2',
      saleIsActive: true
    });

    const fee = await splice.quote(testNft.address, 2);

    const receipt = await (
      await _splice.mint(testNft.address, 1, 2, [], ethers.constants.HashZero, {
        value: fee
      })
    ).wait();

    const transferEvent = receipt.events?.find(
      (e: Event) => e.event === 'Transfer'
    );

    expect(transferEvent).to.not.be.undefined;
    const combinedTokenId = (transferEvent as TransferEvent).args.tokenId;

    const { token_id, style_token_id } =
      tokenIdToStyleAndToken(combinedTokenId);

    expect(token_id).to.equal(1);
    expect(style_token_id).to.equal(2);
  });

  it('can lookup splices of an origin', async function () {
    const originHash = await splice.originHash(testNft.address, 1);
    const spliceCount = await splice.spliceCountForOrigin(originHash);
    expect(spliceCount).to.equal(2);

    const firstSpliceId = await splice.originToTokenId(originHash, 0);
    const first = tokenIdToStyleAndToken(firstSpliceId);
    expect(first.style_token_id).to.equal(1);
    expect(first.token_id).to.equal(1);

    const secondSpliceId = await splice.originToTokenId(originHash, 1);
    const second = tokenIdToStyleAndToken(secondSpliceId);
    expect(second.style_token_id).to.equal(2);
    expect(second.token_id).to.equal(1);
    try {
      await splice.originToTokenId(originHash, 2);
      expect.fail('it mustnt be possible to read outside array bounds');
    } catch (e: any) {
      expect(e.message).to.contain('Transaction reverted');
    }
  });

  it('withdraws shared funds from escrow', async function () {
    const artistCollectedFees = await splice.shareBalanceOf(
      await _artist.getAddress()
    );
    const artistEth = ethers.utils.formatUnits(artistCollectedFees, 'ether');
    const expected = (0.1 + 0.2) * 0.85; //1 mint for 0.1, 1 mint for 0.2 times 85% share
    expect(expected.toString()).to.equal(artistEth);

    const curBalance = await _artist.getBalance();
    const _splice = splice.connect(_artist);
    await (await _splice.withdrawShares()).wait();
    const newBalance = await _artist.getBalance();
    const diff = parseFloat(
      ethers.utils.formatUnits(newBalance.sub(curBalance), 'ether')
    );
    expect(expected - diff).to.be.lessThan(0.001); //gas fees ;)

    const ownerCurBalance = await _owner.getBalance();
    await (await splice.withdrawShares()).wait();
    const ownerNewBalance = await _owner.getBalance();
    const ownerDiff = parseFloat(
      ethers.utils.formatUnits(ownerNewBalance.sub(ownerCurBalance), 'ether')
    );
    const ownerExpected = (0.1 + 0.2) * 0.15;
    expect(ownerExpected - ownerDiff).to.be.lessThan(0.001);
  });

  it('reallocates funds to new owners of the style token', async function () {
    const _styleNFT = styleNFT.connect(_artist);
    const anotherArtist = (await ethers.getSigners())[15];
    const _anotherArtistAddress = await anotherArtist.getAddress();
    await (
      await _styleNFT.transferFrom(
        await _artist.getAddress(),
        await _anotherArtistAddress,
        2
      )
    ).wait();

    expect(await _styleNFT.ownerOf(2)).to.be.equal(_anotherArtistAddress);
    const _nft = testNft.connect(_user);
    await (await _nft.mint(await _user.getAddress())).wait();

    const _splice = splice.connect(_user);
    const fee = await splice.quote(testNft.address, 2);

    await (
      await _splice.mint(testNft.address, 2, 2, [], ethers.constants.HashZero, {
        value: fee
      })
    ).wait();

    const artistShares = await _splice.shareBalanceOf(
      await _artist.getAddress()
    );
    expect(artistShares.isZero()).to.be.true;

    const anotherArtistShares = await _splice.shareBalanceOf(
      _anotherArtistAddress
    );
    const expected = 0.2 * 0.85;
    expect(ethers.utils.formatUnits(anotherArtistShares, 'ether')).to.be.equal(
      expected.toString()
    );
  });
  it('disallows writing on or replacing the style nft', async function () {
    try {
      await styleNFT.incrementMintedPerStyle(2);
      expect.fail(
        "it shouldn't be possible to access the style contract directly"
      );
    } catch (e: any) {
      expect(e.message).to.contain('only callable by Splice');
    }

    try {
      await styleNFT.decreaseAllowance(2, await _user.getAddress());
      expect.fail(
        "it shouldn't be possible to access the style contract directly"
      );
    } catch (e: any) {
      expect(e.message).to.contain('only callable by Splice');
    }

    try {
      const _splice = splice.connect(_user);
      await (await _splice.setStyleNFT(ethers.constants.AddressZero)).wait();
      expect.fail(
        'no one other than owner should be able to set the style nft'
      );
    } catch (e: any) {
      expect(e.message).to.contain('Ownable: caller is not the owner');
    }
  });
  it('can not mint when paused', async function () {
    const fee = await splice.quote(testNft.address, 2);

    await splice.pause();
    const _splice = splice.connect(_user);
    try {
      await (
        await _splice.mint(
          testNft.address,
          2,
          2,
          [],
          ethers.constants.HashZero,
          {
            value: fee
          }
        )
      ).wait();
      expect.fail('minting shouldnt be possible when paused');
    } catch (e: any) {
      expect(e.message).to.contain('Pausable: paused');
    }
    await splice.unpause();
  });
  it('can not withdraw from escrow when paused', async function () {
    await splice.pause();
    try {
      await (await splice.withdrawShares()).wait();
      expect.fail('it shouldnt be possible to withdraw shares when paused');
    } catch (e: any) {
      expect(e.message).to.contain('Pausable: paused');
    }
  });

  it.skip('withdraws ERC20 tokens that have been transferred to it');
});
