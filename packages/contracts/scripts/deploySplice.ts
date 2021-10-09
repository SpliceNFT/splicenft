import { ethers, upgrades } from 'hardhat';

(async () => {
  const Validator = await ethers.getContractFactory('SpliceValidator');
  const validator = await Validator.deploy();
  console.log('Deployed validator:', validator.address);

  const Splice = await ethers.getContractFactory('Splice', {
    // we might need to deploy that separately because of size
    // libraries: {
    //   Base58: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0'
    // }
  });
  const splice = await upgrades.deployProxy(Splice, ['Splice', 'SPLICE']);
  console.log('Deployed splice contract:', splice.address);

  //await splice.deployed();

  validator.setSplice(splice.address);
  splice.setValidator(validator.address);
  console.log('connected both instances');
})();
