import { ethers, upgrades } from 'hardhat';

import {
  Splice,
  SplicePriceStrategyStatic,
  Splice__factory,
  TestnetNFT,
  TestnetNFT__factory
} from '../../typechain';

export async function deploySplice(): Promise<Splice> {
  const SpliceFactory = (await ethers.getContractFactory(
    'Splice'
  )) as Splice__factory;

  const SpliceStyleNFT = await ethers.getContractFactory('SpliceStyleNFT');
  const spliceStyleNFT = await SpliceStyleNFT.deploy();

  const splice = (await upgrades.deployProxy(SpliceFactory, [
    'Splice',
    'SPLICE',
    'http://localhost:5999/metadata/31337/',
    spliceStyleNFT.address
  ])) as Splice;

  await spliceStyleNFT.setSplice(splice.address);

  return splice;
}

export async function deployStaticPriceStrategy(): Promise<SplicePriceStrategyStatic> {
  const PriceStrategy = await ethers.getContractFactory(
    'SplicePriceStrategyStatic'
  );
  const staticPriceStrategy = await PriceStrategy.deploy();
  return staticPriceStrategy;
}

export async function deployTestnetNFT(): Promise<TestnetNFT> {
  const TestnetNFTFactory = (await ethers.getContractFactory(
    'TestnetNFT'
  )) as TestnetNFT__factory;
  return TestnetNFTFactory.deploy(
    'TestnetNFT',
    'COOL',
    'https://api.coolcatsnft.com/cat/',
    10000
  );
}
