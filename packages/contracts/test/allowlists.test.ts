import { expect } from 'chai';
import { Signer, utils } from 'ethers';
import { ethers } from 'hardhat';
import { of as ipfsHashOf } from 'ipfs-only-hash';
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
import { createMerkleProof, mintStyle } from './lib/helpers';

const ONE_DAY = 60 * 60 * 24;

describe('Allowlists', function () {
  let testNft: TestnetNFT;
  let splice: Splice;
  let priceStrategy: SplicePriceStrategyStatic;
  let styleNFT: SpliceStyleNFT;

  let signers: Signer[];
  let _artist: Signer;
  let _delegateArtist: Signer;
  let _user: Signer;
  let _owner: Signer;
  let _allowedAddresses: string[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _delegateArtist = signers[17];
    _artist = signers[18];
    _user = signers[19];
    _allowedAddresses = await Promise.all(
      [1, 2, 3].map((i) => signers[i].getAddress())
    );
  });

  it('deploys nft & splice', async function () {
    splice = await deploySplice();
    testNft = await deployTestnetNFT();
    priceStrategy = await deployStaticPriceStrategy();
    const styleNftAddress = await splice.styleNFT();
    styleNFT = SpliceStyleNFT__factory.connect(styleNftAddress, _owner);

    const artistAddress = await _artist.getAddress();
    await (await styleNFT.allowArtist(artistAddress)).wait();

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
    const _styleNft = styleNFT.connect(_artist);
    const styleTokenId = await mintStyle(
      _styleNft,
      priceStrategy.address,
      '0.1',
      true
    );

    const merkleTree = createMerkleProof(_allowedAddresses);
    await _styleNft.addAllowlist(
      styleTokenId,
      2,
      1,
      merkleTree.getHexRoot(),
      new Date().getTime() + ONE_DAY + 1
    );
  });

  it('can prove that someone is on the allowlist', async function () {
    const _styleNft = styleNFT.connect(_artist);
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

  it('cannot use allowlists that are shorter than 1 day ', async function () {
    const _styleNft = styleNFT.connect(_artist);
    const styleTokenId = await mintStyle(
      _styleNft,
      priceStrategy.address,
      '0.2',
      true
    );

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

  it('cant add an allowlist that contradicts the style cap', async function () {});

  it.skip('cant control the allowlist when not owner of the style');
  it.skip('cant add the allowlist again');
});
