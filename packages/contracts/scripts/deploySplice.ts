import { ethers, upgrades } from 'hardhat';

(async () => {
  await (async () => {
    const Splice = await ethers.getContractFactory('Splice');
    const splice = await upgrades.deployProxy(Splice, [
      'Splice',
      'DTF',
      'ipfs://',
      10000
    ]);

    //await splice.deployed();

    console.log('Deployed splice contracts:', splice.address);
  })();
})();
