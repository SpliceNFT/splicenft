import { ethers, upgrades } from 'hardhat';

(async () => {
  await (async () => {
    const Splice = await ethers.getContractFactory('Splice');
    const splice = await upgrades.upgradeProxy(
      process.env.SPLICE_CONTRACT_ADDRESS as string,
      Splice
    );

    console.log('upgraded splice', splice.address);
  })();
})();
