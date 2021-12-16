import { ethers, upgrades } from 'hardhat';

(async () => {
  const PriceStrategy = await ethers.getContractFactory(
    'SplicePriceStrategyStatic'
  );
  const staticPriceStrategy = await PriceStrategy.deploy();
  console.log('static price strategy instance:', staticPriceStrategy.address);

  const SpliceStyleNFT = await ethers.getContractFactory('SpliceStyleNFT');
  const spliceStyleNFT = await SpliceStyleNFT.deploy();
  console.log('splice style nft:', spliceStyleNFT.address);

  const Splice = await ethers.getContractFactory('Splice');
  const splice = await upgrades.deployProxy(Splice, [
    'Splice',
    'SPLICE',
    'https://validate.getsplice.io/splice/4/',
    spliceStyleNFT.address
  ]);
  console.log('splice contract:', splice.address);

  const q = await spliceStyleNFT.setSplice(splice.address);
  console.log('connected Splice & StyleNFT');
})();
