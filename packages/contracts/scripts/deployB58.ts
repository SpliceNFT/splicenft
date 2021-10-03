import { ethers } from 'hardhat';

async function main() {
  // We get the contract to deploy
  const Base58 = await ethers.getContractFactory('Base58');
  const base58 = await Base58.deploy();

  console.log('Base58 deployed to:', base58.address);
}

(async function () {
  await main();
})();
