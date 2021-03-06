import { ethers, upgrades } from 'hardhat';
import {
  PaymentSplitterController,
  Splice,
  SplicePriceStrategyStatic,
  SpliceStyleNFT,
  Splice__factory,
  TestnetNFT,
  TestnetNFT__factory
} from '../../typechain';

export async function deploySplice(): Promise<{
  splice: Splice;
  styleNft: SpliceStyleNFT;
  paymentSplitterController: PaymentSplitterController;
}> {
  const SpliceFactory = (await ethers.getContractFactory(
    'Splice'
  )) as Splice__factory;

  const SpliceStyleNFTFactory = await ethers.getContractFactory(
    'SpliceStyleNFT'
  );

  const styleNft = (await upgrades.deployProxy(
    SpliceStyleNFTFactory,
    []
  )) as SpliceStyleNFT;
  const PaymentSplitterFactory = await ethers.getContractFactory(
    'PaymentSplitterController'
  );

  const paymentSplitterController = (await upgrades.deployProxy(
    PaymentSplitterFactory,
    [styleNft.address, []]
  )) as PaymentSplitterController;

  await styleNft.setPaymentSplitter(paymentSplitterController.address);

  const splice = (await upgrades.deployProxy(SpliceFactory, [
    'http://localhost:5999/metadata/31337/',
    styleNft.address
  ])) as Splice;

  await styleNft.setSplice(splice.address);

  return { splice, styleNft, paymentSplitterController };
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
