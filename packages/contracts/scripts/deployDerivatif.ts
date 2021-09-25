import { ethers, upgrades } from 'hardhat';

(async () => {
  await (async () => {
    const Derivatif = await ethers.getContractFactory('Derivatif');
    const derivatif = await upgrades.deployProxy(Derivatif, [
      'Derivatif',
      'DTF',
      'ipfs://',
      10000
    ]);

    //await derivatif.deployed();

    console.log('Deployed derivatif contracts:', derivatif.address);
  })();
})();
