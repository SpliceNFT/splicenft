import { ethers, upgrades } from 'hardhat';

import {
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT,
  Splice__factory,
  TestnetNFT,
  TestnetNFT__factory
} from '../../typechain';

export async function deploySplice(): Promise<Splice> {
  const SpliceFactory = (await ethers.getContractFactory(
    'Splice'
  )) as Splice__factory;

  const SpliceStyleNFTFactory = await ethers.getContractFactory(
    'SpliceStyleNFT'
  );

  const spliceStyleNFT = (await upgrades.deployProxy(
    SpliceStyleNFTFactory,
    []
  )) as SpliceStyleNFT;

  const splice = (await upgrades.deployProxy(SpliceFactory, [
    'http://localhost:5999/metadata/31337/',
    spliceStyleNFT.address
  ])) as Splice;

  await spliceStyleNFT.setSplice(splice.address);

  return splice;
}

export async function deployStaticPriceStrategy(
  spliceStyleNFTAddress: string
): Promise<SplicePriceStrategyStatic> {
  const PriceStrategy = await ethers.getContractFactory(
    'SplicePriceStrategyStatic'
  );
  const staticPriceStrategy = await PriceStrategy.deploy(spliceStyleNFTAddress);
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
