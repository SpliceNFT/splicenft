import { ethers } from 'hardhat';

async function main() {
  // We get the contract to deploy
  const Test = await ethers.getContractFactory('Test');
  const test = await Test.deploy();

  console.log('Test deployed to:', test.address);
}

(async function () {
  await main();
})();
