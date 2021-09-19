import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { SampleNFT, SampleNFT__factory } from '../typechain';

describe('Two NFTs', function () {
  let nft1: SampleNFT;
  let nft2: SampleNFT;

  let signers: Signer[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
  });

  it('deploys two greeting contracts', async function () {
    const SampleNFTFactory = (await ethers.getContractFactory(
      'SampleNFT'
    )) as SampleNFT__factory;
    nft1 = (await SampleNFTFactory.deploy(
      'SampleNFT 1',
      'SNFT1',
      'https://sample.token.one/'
    )) as SampleNFT;
    nft2 = await SampleNFTFactory.deploy(
      'SampleNFT 2',
      'SNFT2',
      'https://two.token.sample/'
    );

    expect(nft1.address).not.eq(nft2.address);
  });

  it('can grant minter roles on contracts', async function () {
    const me = await signers[0].getAddress();
    const MINTER_ROLE = await nft1.MINTER_ROLE();
    await nft1.grantRole(MINTER_ROLE, me);
    const hasRole = await nft1.hasRole(MINTER_ROLE, me);
    expect(hasRole).to.be.true;
  });

  it('can mint tokens on both contracts', async function () {
    const me = await signers[0].getAddress();
    const you = await signers[1].getAddress();

    const res1 = await nft1.mint(me);
    const res2 = await nft1.mint(you);

    const totalSupply = await nft1.totalSupply();
    expect(totalSupply).to.eq(2);

    const uri = await nft1.tokenURI(1);
    expect(uri).to.eq('https://sample.token.one/1');
  });
});
