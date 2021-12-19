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

  console.log('deployed splice style nft:', spliceStyleNFT.address);

  const PriceStrategy = await ethers.getContractFactory(
    'SplicePriceStrategyStatic'
  );
  const staticPriceStrategy = await PriceStrategy.deploy(
    spliceStyleNFT.address
  );
  console.log('deployed static price strategy:', staticPriceStrategy.address);

  const Splice = await ethers.getContractFactory('Splice');
  const splice = await upgrades.deployProxy(Splice, [
    'https://validate.getsplice.io/splice/4/',
    spliceStyleNFT.address
  ]);
  console.log('deployed splice:', splice.address);

  const q = await spliceStyleNFT.setSplice(splice.address);
  console.log('connected Splice & StyleNFT');
})();
