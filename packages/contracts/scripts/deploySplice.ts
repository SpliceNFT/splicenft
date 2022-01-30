import { ethers, upgrades } from 'hardhat';
import { SpliceStyleNFT } from '../typechain';

(async () => {
  const SpliceStyleNFTFactory = await ethers.getContractFactory(
    'SpliceStyleNFT'
  );
  const spliceStyleNFT = (await upgrades.deployProxy(
    SpliceStyleNFTFactory,
    []
  )) as SpliceStyleNFT;

  console.log('splice style nft:', spliceStyleNFT.address);

  const PaymentSplitterFactory = await ethers.getContractFactory(
    'PaymentSplitterController'
  );

  const paymentSplitterController = await upgrades.deployProxy(
    PaymentSplitterFactory,
    [spliceStyleNFT.address, []]
  );
  console.log(
    'payment splitter controller:',
    paymentSplitterController.address
  );
  await spliceStyleNFT.setPaymentSplitter(paymentSplitterController.address);

  const PriceStrategy = await ethers.getContractFactory(
    'SplicePriceStrategyStatic'
  );
  const staticPriceStrategy = await PriceStrategy.deploy(
    spliceStyleNFT.address
  );
  console.log('static price strategy:', staticPriceStrategy.address);

  const Splice = await ethers.getContractFactory('Splice');
  const splice = await upgrades.deployProxy(Splice, [
    'https://validate.getsplice.io/splice/4/',
    spliceStyleNFT.address
  ]);
  console.log('splice contract:', splice.address);

  const q = await spliceStyleNFT.setSplice(splice.address);
  console.log('connected Splice & StyleNFT');
})();
