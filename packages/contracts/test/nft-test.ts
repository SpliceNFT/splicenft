import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { TestnetNFT, TestnetNFT__factory } from '../typechain';

describe('Two NFTs', function () {
  let nft1: TestnetNFT;
  let nft2: TestnetNFT;

  let signers: Signer[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
  });

  it('deploys two nft contracts', async function () {
    const TestnetNFTFactory = (await ethers.getContractFactory(
      'TestnetNFT'
    )) as TestnetNFT__factory;
    nft1 = (await TestnetNFTFactory.deploy(
      'SampleNFT 1',
      'SNFT1',
      'https://sample.token.one/',
      1000
    )) as TestnetNFT;
    nft2 = await TestnetNFTFactory.deploy(
      'SampleNFT 2',
      'SNFT2',
      'https://two.token.sample/',
      1000
    );

    expect(nft1.address).not.eq(nft2.address);
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
