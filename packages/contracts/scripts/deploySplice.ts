import { ethers, upgrades } from 'hardhat';

(async () => {
  const Splice = await ethers.getContractFactory('Splice', {
    // we might need to deploy that separately because of size
    // libraries: {
    //   Base58: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0'
    // }
  });
  const splice = await upgrades.deployProxy(Splice, ['Splice', 'SPLICE']);

  //await splice.deployed();

  console.log('Deployed splice contracts:', splice.address);
})();
