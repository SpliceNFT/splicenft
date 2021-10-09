import { ethers, upgrades } from 'hardhat';

(async () => {
  const Validator = await ethers.getContractFactory('SpliceValidator');
  const validator = await Validator.deploy();
  console.log('Deployed validator:', validator.address);
})();
