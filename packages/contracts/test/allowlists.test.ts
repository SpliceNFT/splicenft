import { expect } from 'chai';
import { Signer, utils } from 'ethers';
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
import { createMerkleProof, mintStyle, mintTestnetNFT } from './lib/helpers';

const ONE_DAY_AND_A_BIT = 60 * 60 * 24 + 60;

describe('Allowlists', function () {
  let testNft: TestnetNFT;
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;

  let signers: Signer[];
  let _styleMinter: Signer;
  let _delegateCurator: Signer;
  let _user: Signer;
  let _owner: Signer;
  let _allowedUsers: Signer[];
  let _allowedAddresses: string[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _delegateCurator = signers[17];
    _styleMinter = signers[18];
    _user = signers[19];
    _allowedUsers = [1, 2, 3].map((i) => signers[i]);
    _allowedAddresses = await Promise.all(
      _allowedUsers.map((u) => u.getAddress())
    );
  });

  it('deploys nft & splice', async function () {
    splice = await deploySplice();
    testNft = await deployTestnetNFT();

    const styleNftAddress = await splice.styleNFT();
    styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, _owner);

    priceStrategy = await deployStaticPriceStrategy(styleNftAddress);

    const styleMinterAddress = await _styleMinter.getAddress();
    await (await styleNFT.toggleStyleMinter(styleMinterAddress, true)).wait();

    const _nft = testNft.connect(_user);
    const transaction = await _nft.mint(await _user.getAddress());
    const result = await transaction.wait();
    expect(result.events).to.exist;
  });

  it('validates allowlist entries using merkle trees locally', async function () {
    const merkleTree = createMerkleProof(_allowedAddresses);
    const leaf = ethers.utils.keccak256(_allowedAddresses[0]);
    const proof = merkleTree.getProof(leaf);
    expect(proof.length).to.eql(2);

    expect(merkleTree.verify(proof, leaf, merkleTree.getRoot())).to.be.true;
  });

  it('can add an allowlist to a style', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address);

    const merkleTree = createMerkleProof(_allowedAddresses);
    await _styleNft.addAllowlist(
      styleTokenId,
      2,
      1,
      merkleTree.getHexRoot(),
      new Date().getTime() + ONE_DAY_AND_A_BIT + 1
    );
  });

  it('can prove that someone is on the allowlist', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const merkleTree = createMerkleProof(_allowedAddresses);
    const leaf = utils.keccak256(_allowedAddresses[0]);
    const proof = merkleTree.getHexProof(leaf);

    const verified = await _styleNft.verifyAllowlistEntryProof(
      1,
      proof,
      _allowedAddresses[0]
    );
    expect(verified).to.be.true;

    const badActorAddress = await signers[15].getAddress();

    const _merkleTree = createMerkleProof([
      ..._allowedAddresses,
      badActorAddress
    ]);
    const _leaf = utils.keccak256(badActorAddress);
    const _proof = _merkleTree.getHexProof(_leaf);

    const _verified = await _styleNft.verifyAllowlistEntryProof(
      1,
      _proof,
      badActorAddress
    );
    expect(_verified).to.be.false;
  });

  it('cannot use allowlists that are shorter than 1 day', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address, {
      priceInEth: '0.2',
      saleIsActive: true,
      cap: 100
    });

    const merkleTree = createMerkleProof(_allowedAddresses);
    try {
      await _styleNft.addAllowlist(
        styleTokenId,
        2,
        1,
        merkleTree.getHexRoot(),
        Math.floor(new Date().getTime() / 1000) + 1
      );
      expect.fail('durations of allow lists must be longer than 1 day');
    } catch (e: any) {
      expect(e.message).to.contain('AllowlistDurationTooShort');
    }
  });

  it('cant overwrite existing allowlists', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address);
    await _styleNft.addAllowlist(
      styleTokenId,
      10,
      1,
      ethers.constants.HashZero,
      Math.floor(new Date().getTime() / 1000) + ONE_DAY_AND_A_BIT
    );
    try {
      await _styleNft.addAllowlist(
        styleTokenId,
        20,
        2,
        ethers.constants.HashZero,
        Math.floor(new Date().getTime() / 1000) + ONE_DAY_AND_A_BIT
      );
      expect.fail('allowlists shouldnt be overwriteable');
    } catch (e: any) {
      expect(e.message).to.contain('AllowlistNotOverridable');
    }
  });

  it('cant control the allowlist when not owner of the style', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address);
    await (
      await _styleNft.transferFrom(
        await _styleMinter.getAddress(),
        await _delegateCurator.getAddress(),
        styleTokenId
      )
    ).wait();

    try {
      await _styleNft.addAllowlist(
        styleTokenId,
        20,
        2,
        ethers.constants.HashZero,
        Math.floor(new Date().getTime() / 1000) + ONE_DAY_AND_A_BIT
      );
      expect.fail('allowlists must only be editable by their owner');
    } catch (e: any) {
      expect(e.message).to.contain('NotControllingStyle');
    }
  });

  it('can add an allowlist after minting has started but only if its parameters fit', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const _splice = splice.connect(_user);

    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address, {
      saleIsActive: true,
      priceInEth: '0.1',
      cap: 5
    });

    const mintingFee = await _splice.quote(
      styleTokenId,
      [testNft.address],
      [1]
    );

    const nftTokenIds = await Promise.all(
      [0, 1].map((i) =>
        (async () => {
          const nftTokenId = await mintTestnetNFT(testNft, _user);
          await _splice.mint(
            [testNft.address],
            [nftTokenId],
            styleTokenId,
            [],
            [],
            {
              value: mintingFee
            }
          );
          return nftTokenId;
        })()
      )
    );

    try {
      await _styleNft.addAllowlist(
        styleTokenId,
        4,
        2,
        ethers.constants.HashZero,
        Math.floor(new Date().getTime() / 1000) + ONE_DAY_AND_A_BIT
      );
      expect.fail(
        'it shouldnt be possible to add an allowlist that exceeds available mints'
      );
    } catch (e: any) {
      expect(e.message).to.contain('BadReservationParameters');
    }

    await _styleNft.addAllowlist(
      styleTokenId,
      3,
      2,
      ethers.constants.HashZero,
      Math.floor(new Date().getTime() / 1000) + ONE_DAY_AND_A_BIT
    );
  });

  it('lets public users mint up to the unreserved cap', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address, {
      cap: 5,
      saleIsActive: false
    });

    //3 mints are reserved for 3 users (_allowedUsers)
    //each of them may mint 2 tokens.
    const merkleTree = createMerkleProof(_allowedAddresses);
    await _styleNft.addAllowlist(
      styleTokenId,
      3,
      2,
      merkleTree.getHexRoot(),
      new Date().getTime() + ONE_DAY_AND_A_BIT
    );

    const mintingFee = await splice.quote(styleTokenId, [testNft.address], [0]);

    await (await _styleNft.toggleSaleIsActive(styleTokenId, true)).wait();

    expect(await _styleNft.availableForPublicMinting(styleTokenId)).to.equal(2);

    const tokensOfPublicUser = await Promise.all(
      [0, 1, 2].map((i) => mintTestnetNFT(testNft, _user))
    );

    //mint 2 public splices
    const _publicSplice = splice.connect(_user);
    await (
      await _publicSplice.mint(
        [testNft.address],
        [tokensOfPublicUser[0]],
        styleTokenId,
        [],
        [],
        {
          value: mintingFee
        }
      )
    ).wait();

    await (
      await _publicSplice.mint(
        [testNft.address],
        [tokensOfPublicUser[1]],
        styleTokenId,
        [],
        [],
        {
          value: mintingFee
        }
      )
    ).wait();

    expect(await _styleNft.availableForPublicMinting(styleTokenId)).to.equal(0);

    try {
      await _publicSplice.mint(
        [testNft.address],
        [tokensOfPublicUser[2]],
        styleTokenId,
        [],
        [],
        {
          value: mintingFee
        }
      );
      expect.fail('public mints must respect the reserved token cap');
    } catch (e: any) {
      expect(e.message).to.contain('NotAllowedToMint');
    }

    //lets mint by the reserved users
    const allowed0Token0 = await mintTestnetNFT(testNft, _allowedUsers[0]);
    const allowed0Token1 = await mintTestnetNFT(testNft, _allowedUsers[0]);
    const allowed0Token2 = await mintTestnetNFT(testNft, _allowedUsers[0]);
    const allowed1Token0 = await mintTestnetNFT(testNft, _allowedUsers[1]);
    const allowed1Token1 = await mintTestnetNFT(testNft, _allowedUsers[1]);

    const leaf0 = utils.keccak256(await _allowedUsers[0].getAddress());
    const proof0 = merkleTree.getHexProof(leaf0);
    const _allowedUser0Splice = splice.connect(_allowedUsers[0]);

    await (
      await _allowedUser0Splice.mint(
        [testNft.address],
        [allowed0Token0],
        styleTokenId,
        proof0,
        [],
        {
          value: mintingFee
        }
      )
    ).wait();

    await (
      await _allowedUser0Splice.mint(
        [testNft.address],
        [allowed0Token1],
        styleTokenId,
        proof0,
        [],
        {
          value: mintingFee
        }
      )
    ).wait();

    try {
      await _allowedUser0Splice.mint(
        [testNft.address],
        [allowed0Token2],
        styleTokenId,
        proof0,
        [],
        {
          value: mintingFee
        }
      );
      expect.fail(
        'allowed user was able to mint beyond their reservation limit'
      );
    } catch (e: any) {
      expect(e.message).to.contain('PersonalReservationLimitExceeded');
    }

    const leaf1 = utils.keccak256(await _allowedUsers[1].getAddress());
    const proof1 = merkleTree.getHexProof(leaf1);
    const _allowedUser1Splice = splice.connect(_allowedUsers[1]);

    await (
      await _allowedUser1Splice.mint(
        [testNft.address],
        [allowed1Token0],
        styleTokenId,
        proof1,
        [],
        {
          value: mintingFee
        }
      )
    ).wait();

    try {
      await _allowedUser1Splice.mint(
        [testNft.address],
        [allowed1Token1],
        styleTokenId,
        proof1,
        [],
        {
          value: mintingFee
        }
      );
      expect.fail('allowed user was able to mint beyond the collection cap');
    } catch (e: any) {
      expect(e.message).to.contain('NotEnoughTokensToMatchReservation');
    }

    expect(await _styleNft.mintsLeft(styleTokenId)).to.equal(0);
  });

  it('shows 0 reserved tokens when no allowlist exists', async function () {
    const _styleNft = styleNFT.connect(_styleMinter);
    const styleTokenId = await mintStyle(_styleNft, priceStrategy.address, {
      cap: 5,
      saleIsActive: false
    });

    expect(await _styleNft.reservedTokens(styleTokenId)).to.equal(0);
  });
});
