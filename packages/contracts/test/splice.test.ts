import { expect } from 'chai';
import { BigNumber, Event, Signer } from 'ethers';
import { ethers } from 'hardhat';
import {
  ChainWallet__factory,
  GLDToken__factory,
  IERC165__factory,
  IERC2981Upgradeable__factory,
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT,
  SpliceStyleNFT__factory,
  TestnetNFT
} from '../typechain';
import { MintedEvent } from '../typechain/Splice';
import {
  deploySplice,
  deployStaticPriceStrategy,
  deployTestnetNFT
} from './lib/deployContracts';
import {
  mintSplice,
  mintStyle,
  mintTestnetNFT,
  originHash,
  tokenIdToStyleAndToken
} from './lib/helpers';

describe('Splice', function () {
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

  it('deploys nft, splice & creates a style', async function () {
    splice = await deploySplice();
    testNft = await deployTestnetNFT();
    priceStrategy = await deployStaticPriceStrategy();
    const styleNftAddress = await splice.styleNFT();
    styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, signers[0]);

    const curatorAddress = await _curator.getAddress();
    await (await styleNFT.toggleCurator(curatorAddress, true)).wait();

    const _styleNft = styleNFT.connect(_curator);
    await mintStyle(_styleNft, priceStrategy.address, { saleIsActive: true });
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
        await _splice.mint(
          [testNft.address],
          [1],
          1,
          [],
          ethers.constants.HashZero
        )
      ).wait();
      expect.fail('shouldnt work because no fees have been sent along');
    } catch (e: any) {
      expect(e.message).contains('InsufficientFees');
    }
  });

  it('reverts when sales is not active', async function () {
    const _splice = splice.connect(_user);
    const fee = await splice.quote(testNft.address, 1);
    const _styleNft = styleNFT.connect(_curator);
    await _styleNft.toggleSaleIsActive(1, false);
    try {
      await mintSplice(_splice, testNft.address, 1, 1);
      expect.fail('should revert because sale on that style isnt active');
    } catch (e: any) {
      expect(e.message).contains('SaleNotActive');
    } finally {
      const _styleNFT = styleNFT.connect(_curator);
      //Activate sales on that style.
      await _styleNFT.toggleSaleIsActive(1, true);
    }
  });

  it('mints a splice from an origin', async function () {
    const _splice = splice.connect(_user);
    const fee = await splice.quote(testNft.address, 1);
    const receipt = await (
      await _splice.mint(
        [testNft.address],
        [1],
        1,
        [],
        ethers.constants.HashZero,
        {
          value: fee
        }
      )
    ).wait();

    const mintedEvent = receipt.events?.find(
      (e: Event) => e.event === 'Minted'
    );

    expect(mintedEvent).to.not.be.undefined;
    const combinedTokenId = (mintedEvent as MintedEvent).args.token_id;

    const { token_id, style_token_id } =
      tokenIdToStyleAndToken(combinedTokenId);

    expect(token_id).to.equal(1);
    expect(style_token_id).to.equal(1);

    const tokenUri = await _splice.tokenURI(combinedTokenId);
    expect(tokenUri).to.equal(
      'http://localhost:5999/metadata/31337/4294967297'
    );
  });

  it('can resolve style and token id from a splice token id', async function () {
    const oneAndOne =
      '0x0000000000000000000000000000000000000000000000000000000100000001';
    let [style, token] = await splice.styleAndTokenByTokenId(oneAndOne);
    expect(style).to.equal(1);
    expect(token).to.equal(1);

    const max =
      '0x000000000000000000000000000000000000000000000000ffffffffffffffff';

    [style, token] = await splice.styleAndTokenByTokenId(max);
    expect(style).to.equal(4294967295);
    expect(token).to.equal(4294967295);

    const somethingInBetween =
      '0x0000000000000000000000000000000000000000000000000000208800000915';

    [style, token] = await splice.styleAndTokenByTokenId(somethingInBetween);
    expect(style).to.equal(0x2088);
    expect(token).to.equal(0x0915);
  });

  it('cannot mint another splice from the same origin and style', async function () {
    const _splice = splice.connect(_user);
    const fee = await _splice.quote(testNft.address, 1);
    try {
      await _splice.mint(
        [testNft.address],
        [1],
        1,
        [],
        ethers.constants.HashZero,
        {
          value: fee
        }
      );

      expect.fail('contract should fail because provenance has been used');
    } catch (e: any) {
      expect(e.message).contains('ProvenanceAlreadyUsed');
    }
  });

  it('can mint another splice from the same origin and different style', async function () {
    const _splice = splice.connect(_user);

    const styleId = await mintStyle(
      styleNFT.connect(_curator),
      priceStrategy.address,
      {
        priceInEth: '0.2',
        saleIsActive: true
      }
    );

    expect(styleId).to.equal(2);

    const combinedTokenId = await mintSplice(_splice, testNft.address, 1, 2);

    const { token_id, style_token_id } =
      tokenIdToStyleAndToken(combinedTokenId);

    expect(token_id).to.equal(1);
    expect(style_token_id).to.equal(2);
  });

  it('can find all splices of a user', async function () {
    const _userAddress = await _user.getAddress();
    const balance = await splice.balanceOf(_userAddress);
    expect(balance.toNumber()).to.equal(2);

    const filter = splice.filters.Transfer(null, _userAddress);
    const transfers = await splice.queryFilter(filter);
    expect(transfers).lengthOf(2);

    const firstEvent = transfers[0];
    const firstSpliceId = firstEvent.args.tokenId;
    const first = tokenIdToStyleAndToken(firstSpliceId);
    expect(first.style_token_id).to.equal(1);
    expect(first.token_id).to.equal(1);

    const secondEvent = transfers[1];
    const secondSpliceId = secondEvent.args.tokenId;
    const second = tokenIdToStyleAndToken(secondSpliceId);
    expect(second.style_token_id).to.equal(2);
    expect(second.token_id).to.equal(1);
  });

  it('can lookup splices of an origin', async function () {
    const oHash = originHash(testNft.address, BigNumber.from(1));
    const filter = splice.filters.Minted(oHash);
    const mintedEvents = await splice.queryFilter(filter);
    expect(mintedEvents).lengthOf(2);

    const firstEvent = mintedEvents[0];
    const firstSpliceId = firstEvent.args.token_id;
    const first = tokenIdToStyleAndToken(firstSpliceId);
    expect(first.style_token_id).to.equal(1);
    expect(first.token_id).to.equal(1);

    const secondEvent = mintedEvents[1];
    const secondSpliceId = secondEvent.args.token_id;
    const second = tokenIdToStyleAndToken(secondSpliceId);
    expect(second.style_token_id).to.equal(2);
    expect(second.token_id).to.equal(1);
  });

  it('gets the full provenance by a token id', async function () {
    const oneAndOne =
      '0x0000000000000000000000000000000000000000000000000000000100000001';

    const spliceTokenId = BigNumber.from(oneAndOne);
    const filter = splice.filters.Minted(null, spliceTokenId);

    const mintedEvents = await splice.queryFilter(filter);
    expect(mintedEvents).lengthOf(1);

    const mintEvent = mintedEvents[0];
    const tx = await mintEvent.getTransaction();
    const inputData = splice.interface.decodeFunctionData(
      splice.interface.functions[
        'mint(address[],uint256[],uint32,bytes32[],bytes)'
      ],
      tx.data
    );

    expect(inputData.origin_collections[0]).to.equal(testNft.address);
    expect(inputData.origin_token_ids[0]).to.equal(1);
  });

  it('withdraws shared funds from escrow', async function () {
    const curatorAddress = await _curator.getAddress();
    const ownerAddress = await _owner.getAddress();
    const curatorCollectedFees = await splice.escrowedBalanceOf(curatorAddress);
    const curatorEth = ethers.utils.formatUnits(curatorCollectedFees, 'ether');
    const expected = (0.1 + 0.2) * 0.85; //1 mint for 0.1, 1 mint for 0.2 times 85% share
    expect(expected.toString()).to.equal(curatorEth);

    const curBalance = await _curator.getBalance();
    const _splice = splice.connect(_curator);
    await (await _splice.claimShares(curatorAddress)).wait();
    const newBalance = await _curator.getBalance();
    const diff = parseFloat(
      ethers.utils.formatUnits(newBalance.sub(curBalance), 'ether')
    );
    expect(expected - diff).to.be.lessThan(0.001); //gas fees ;)

    const ownerCurBalance = await _owner.getBalance();
    await (await splice.claimShares(ownerAddress)).wait();
    const ownerNewBalance = await _owner.getBalance();
    const ownerDiff = parseFloat(
      ethers.utils.formatUnits(ownerNewBalance.sub(ownerCurBalance), 'ether')
    );
    const ownerExpected = (0.1 + 0.2) * 0.15;
    expect(ownerExpected - ownerDiff).to.be.lessThan(0.001);
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
    expect(nftTokenId).to.equal(2);

    await mintSplice(splice.connect(_user), testNft.address, nftTokenId, 2);

    const beneficiaryExpected = 0.2 * 0.15;
    const beneficiaryShares = await splice.escrowedBalanceOf(signer13);
    expect(ethers.utils.formatUnits(beneficiaryShares, 'ether')).to.be.equal(
      beneficiaryExpected.toString()
    );
  });

  it('reallocates funds to new owners of the style token', async function () {
    const _styleNFT = styleNFT.connect(_curator);
    const anotherCurator = signers[15];
    const _curatorAddress = await _curator.getAddress();
    const _anotherCuratorAddress = await anotherCurator.getAddress();
    const oldCuratorShares = await splice.escrowedBalanceOf(_curatorAddress);

    await (
      await _styleNFT.transferFrom(
        await _curator.getAddress(),
        _anotherCuratorAddress,
        2
      )
    ).wait();

    expect(await _styleNFT.ownerOf(2)).to.be.equal(_anotherCuratorAddress);

    const nftTokenId = await mintTestnetNFT(testNft, _user);
    expect(nftTokenId).to.equal(3);

    await mintSplice(splice.connect(_user), testNft.address, nftTokenId, 2);

    expect(await splice.escrowedBalanceOf(_curatorAddress)).to.equal(
      oldCuratorShares
    );

    const anotherCuratorShares = await splice.escrowedBalanceOf(
      _anotherCuratorAddress
    );
    const expected = 0.2 * 0.85;
    expect(ethers.utils.formatUnits(anotherCuratorShares, 'ether')).to.be.equal(
      expected.toString()
    );
    await splice.connect(anotherCurator).claimShares(_anotherCuratorAddress);
    expect(
      await (await splice.escrowedBalanceOf(_anotherCuratorAddress)).isZero()
    ).to.be.true;
  });

  it('can update the artist share rate', async function () {
    await splice.updateArtistShare(90);
    const anotherCurator = signers[15];
    const _anotherCuratorAddress = await anotherCurator.getAddress();

    const nftTokenId = await mintTestnetNFT(testNft, _user);
    expect(nftTokenId).to.equal(4);
    await mintSplice(splice.connect(_user), testNft.address, nftTokenId, 2);

    const anotherCuratorShares = await splice.escrowedBalanceOf(
      _anotherCuratorAddress
    );
    const expected = (0.2 * 0.9).toFixed(2);
    expect(ethers.utils.formatUnits(anotherCuratorShares, 'ether')).to.be.equal(
      expected
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
  });

  it('can not mint when paused', async function () {
    await splice.pause();
    const _splice = splice.connect(_user);
    try {
      await mintSplice(_splice, testNft.address, 2, 2);
      expect.fail('minting shouldnt be possible when paused');
    } catch (e: any) {
      expect(e.message).to.contain('Pausable: paused');
    } finally {
      await splice.unpause();
    }
  });

  it('can not withdraw from escrow when paused', async function () {
    await splice.pause();
    const _ownerAddress = await _owner.getAddress();
    try {
      await (await splice.claimShares(_ownerAddress)).wait();
      expect.fail('it shouldnt be possible to withdraw shares when paused');
    } catch (e: any) {
      expect(e.message).to.contain('Pausable: paused');
    } finally {
      await splice.unpause();
    }
  });

  it('cannot mint on an origin using a style with collection constraints', async function () {
    const anotherNFT1 = await deployTestnetNFT();
    const anotherNFT2 = await deployTestnetNFT();

    const _styleNFT = styleNFT.connect(_curator);
    const styleTokenId = await mintStyle(_styleNFT, priceStrategy.address, {
      saleIsActive: true
    });
    await _styleNFT.restrictToCollections(styleTokenId, [
      anotherNFT1.address,
      anotherNFT2.address
    ]);

    expect(
      await _styleNFT.canBeMintedOnCollection(styleTokenId, anotherNFT1.address)
    ).to.be.true;
    expect(
      await _styleNFT.canBeMintedOnCollection(styleTokenId, anotherNFT2.address)
    ).to.be.true;
    expect(
      await _styleNFT.canBeMintedOnCollection(styleTokenId, testNft.address)
    ).to.be.false;

    const testnetToken1 = await mintTestnetNFT(anotherNFT1, _user);
    const disallowedTestnetToken = await mintTestnetNFT(testNft, _user);

    const fee = await splice.quote(testNft.address, styleTokenId);
    const _splice = splice.connect(_user);
    //test that the constraints implicitly hold
    await (
      await _splice.mint(
        [anotherNFT1.address],
        [testnetToken1],
        styleTokenId,
        [],
        ethers.constants.HashZero,
        {
          value: fee
        }
      )
    ).wait();

    try {
      await _splice.mint(
        [testNft.address],
        [disallowedTestnetToken],
        styleTokenId,
        [],
        ethers.constants.HashZero,
        {
          value: fee
        }
      );
      expect.fail('user was able to mint on a constrained style');
    } catch (e: any) {
      expect(e.message).to.contain('NotAllowedToMint');
    }
  });

  it('can freeze a style #119', async function () {
    const _styleNFT = styleNFT.connect(_curator);
    const _splice = splice.connect(_user);

    const styleTokenId = await mintStyle(_styleNFT, priceStrategy.address, {
      saleIsActive: true,
      cap: 6
    });

    const nfts = await Promise.all(
      [0, 1, 2, 3, 4].map((i) => mintTestnetNFT(testNft, _user))
    );

    const splices: BigNumber[] = await Promise.all(
      nfts.map((nftTokenId) =>
        mintSplice(_splice, testNft.address, nftTokenId, styleTokenId)
      )
    );

    expect(await _splice.tokenURI(splices[0])).to.contain(
      'http://localhost:5999/metadata/31337/'
    );
    //in the meanwhile... store the metadata on ipfs... and then...

    try {
      await _styleNFT.freeze(styleTokenId, 'QmSomeIpfsHash');
      expect.fail('mustnt freeze with an obviously bad ipfs hash');
    } catch (e: any) {
      expect(e.message).to.contain('InvalidCID()');
    }

    try {
      await _styleNFT.freeze(
        styleTokenId,
        'QmZWpKHVsiNGGGa9GtGvtdXJBTHV3r3eEpmesXhf7MeRZC'
      );
      expect.fail('a style mustnt be frozen if its not fully minted');
    } catch (e: any) {
      expect(e.message).to.contain('CantFreezeAnUncompleteCollection(1)');
    }

    const lastNft = await mintTestnetNFT(testNft, _user);
    const lastSplice = await mintSplice(
      _splice,
      testNft.address,
      lastNft,
      styleTokenId
    );

    await _styleNFT.freeze(
      styleTokenId,
      'QmZWpKHVsiNGGGa9GtGvtdXJBTHV3r3eEpmesXhf7MeRZC'
    );

    for await (const spliceId of splices) {
      const tokenUri = await _splice.tokenURI(spliceId);
      const { token_id: tokenTokenId } = tokenIdToStyleAndToken(spliceId);
      expect(tokenUri).to.equal(
        `ipfs://QmZWpKHVsiNGGGa9GtGvtdXJBTHV3r3eEpmesXhf7MeRZC/${tokenTokenId}`
      );
    }

    //once its frozen it can't be thawed or minted
    try {
      const anotherNft = await mintTestnetNFT(testNft, _user);
      await mintSplice(_splice, testNft.address, anotherNft, styleTokenId);
      expect.fail('it mustnt be possible to mint on a frozen style');
    } catch (e: any) {
      expect(e.message).to.contain('SaleNotActive');
    }

    expect(await _styleNFT.isSaleActive(styleTokenId)).to.be.false;
    try {
      await _styleNFT.toggleSaleIsActive(styleTokenId, true);
      expect.fail('you mustnt be able to reactivate a frozen style');
    } catch (e: any) {
      expect(e.message).to.contain('StyleIsFrozen');
    }
  });

  it('cant be minted beyond limits', async function () {
    const cappedStyleId = await mintStyle(
      styleNFT.connect(_curator),
      priceStrategy.address,
      { cap: 2 }
    );
    const _splice = splice.connect(_user);
    const nfts = await Promise.all(
      [0, 1, 2].map((i) => mintTestnetNFT(testNft, _user))
    );
    await mintSplice(_splice, testNft.address, nfts[0], cappedStyleId);
    await mintSplice(_splice, testNft.address, nfts[1], cappedStyleId);
    try {
      await mintSplice(_splice, testNft.address, nfts[2], cappedStyleId);
      expect.fail('minted over the cap');
    } catch (e: any) {
      expect(e.message).to.contain('NotAllowedToMint');
    }
  });

  it('lets the owner change the base url', async function () {
    await splice.setBaseUri('http://foo.bar/');
    const oneAndOne =
      '0x0000000000000000000000000000000000000000000000000000000100000001';
    const mdUrl = await splice.tokenURI(oneAndOne);
    expect(mdUrl).contains('foo.bar');
  });

  it('withdraws ERC20 tokens that have been transferred to it', async function () {
    const ERC20Factory = (await ethers.getContractFactory(
      'GLDToken'
    )) as GLDToken__factory;
    const erc20 = await ERC20Factory.deploy(1_000_000);

    const _userAddress = await _user.getAddress();
    await erc20.transfer(_userAddress, 1000);

    expect((await erc20.balanceOf(_userAddress)).toNumber()).to.equal(1000);

    await erc20.transfer(splice.address, 1000);
    expect((await erc20.balanceOf(splice.address)).toNumber()).to.equal(1000);

    const beneficiary = await splice.platformBeneficiary();
    expect((await erc20.balanceOf(beneficiary)).isZero()).to.be.true;
    await splice.withdrawERC20(erc20.address);

    expect((await erc20.balanceOf(beneficiary)).toNumber()).to.equal(1000);
    expect((await erc20.balanceOf(splice.address)).isZero()).to.be.true;
  });

  it('withdraws ERC721 tokens that have been transferred to it', async function () {
    const userAddress = await _user.getAddress();
    const nftId = await mintTestnetNFT(testNft, _user);
    await testNft
      .connect(_user)
      .transferFrom(userAddress, splice.address, nftId); //unsafe transfer!

    expect((await testNft.balanceOf(splice.address)).toNumber()).to.be.equal(1);
    const beneficiary = await splice.platformBeneficiary();
    await splice.withdrawERC721(testNft.address, nftId);
    expect((await testNft.balanceOf(beneficiary)).toNumber()).to.equal(1);
    expect((await testNft.balanceOf(splice.address)).isZero()).to.be.true;
  });

  it('cannot send eth directly (no fallback function)', async function () {
    const web3 = splice.provider;
    const spliceBalance = await web3.getBalance(splice.address);
    expect(spliceBalance?.isZero()).to.be.true;
    try {
      await _user.sendTransaction({
        to: splice.address,
        value: ethers.utils.parseEther('0.123')
      });
      expect.fail('the contract must reject incoming eth tx');
    } catch (e: any) {
      expect(e.message).to.contain('no fallback nor receive function');
    }
  });

  it('refuses safe incoming ERC721 transfers', async function () {
    const userAddress = await _user.getAddress();
    try {
      await testNft
        .connect(_user)
        ['safeTransferFrom(address,address,uint256)'](
          userAddress,
          splice.address,
          BigNumber.from(1)
        );

      expect.fail("Splice shouldn't accept incoming safe ERC721 transfers");
    } catch (e: any) {
      expect(e.message).to.contain(
        'transfer to non ERC721Receiver implementer'
      );
    }
  });

  it('the platform beneficiary can be a payable contract', async function () {
    const ChainWallet = (await ethers.getContractFactory(
      'ChainWallet'
    )) as ChainWallet__factory;
    const wallet = await ChainWallet.deploy();
    splice.setPlatformBeneficiary(wallet.address);

    const nft = await mintTestnetNFT(testNft, _user);
    const _splice = splice.connect(_user);
    await mintSplice(_splice, testNft.address, nft, 1);
    const expected = (0.1 * 0.1).toFixed(2);

    const walletShare = await splice.escrowedBalanceOf(wallet.address);
    expect(ethers.utils.formatUnits(walletShare, 'ether')).to.be.equal(
      expected.toString()
    );
    await wallet.withdrawShares(splice.address);
    const walletBalance = await wallet.provider.getBalance(wallet.address);
    expect(ethers.utils.formatUnits(walletBalance, 'ether')).to.be.equal(
      expected.toString()
    );
  });

  it('signals EIP-165 support on mandatory interfaces', async function () {
    const ifc = IERC165__factory.createInterface();
    const ERC165_INTERFACE = ifc.getSighash(
      ifc.functions['supportsInterface(bytes4)']
    );
    expect(ERC165_INTERFACE).to.equal('0x01ffc9a7');

    const royaltyIfc = IERC2981Upgradeable__factory.createInterface();
    const ERC2981_INTERFACE = royaltyIfc.getSighash(
      royaltyIfc.functions['royaltyInfo(uint256,uint256)']
    );

    const ERC721_INTERFACE = '0x80ac58cd';
    const ERC721_ENUMERABLE = '0x780e9d63';
    const ERC721_METADATA = '0x5b5e139f';

    expect(await splice.supportsInterface(ERC165_INTERFACE)).to.be.true;
    expect(await splice.supportsInterface(ERC721_INTERFACE)).to.be.true;
    expect(await splice.supportsInterface(ERC721_METADATA)).to.be.true;
    expect(await splice.supportsInterface(ERC2981_INTERFACE)).to.be.true;
    expect(await splice.supportsInterface(ERC721_ENUMERABLE)).to.be.false;
  });

  it('sends back surplus fees to the minter', async function () {
    const nftTokenId = await mintTestnetNFT(testNft, _user);
    const _splice = splice.connect(_user);
    const oldBalance = await _user.getBalance();

    const fee = await splice.quote(testNft.address, 2);

    //sending 5 Eth along instead of required 0.2
    const surplusFee = fee.add(ethers.utils.parseEther('5'));

    await (
      await _splice.mint(
        [testNft.address],
        [nftTokenId],
        2,
        [],
        ethers.constants.HashZero,
        {
          value: surplusFee
        }
      )
    ).wait();

    const newBalance = await _user.getBalance();
    const diff = oldBalance.sub(newBalance);
    const flEth = parseFloat(ethers.utils.formatEther(diff));

    expect(flEth).to.be.lt(0.2005);
  });
});
