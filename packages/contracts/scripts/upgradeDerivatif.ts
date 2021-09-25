import { ethers, upgrades } from 'hardhat';

(async () => {
  await (async () => {
    const Derivatif = await ethers.getContractFactory('Derivatif');
    const derivatif = await upgrades.upgradeProxy(
      process.env.DERIVATIF_CONTRACT_ADDRESS as string,
      Derivatif
    );

    console.log('upgraded derivatif', derivatif.address);
  })();
})();
