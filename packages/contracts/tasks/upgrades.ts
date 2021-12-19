import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { ContractFactory } from 'ethers';

//pnpx hardhat --network localhost upgrade exec Splice 0x
task('upgrade', 'upgrades contracts')
  .addPositionalParam('action')
  .addPositionalParam('contractFactory')
  .addPositionalParam('proxyAddress')
  .setAction(async (taskArgs, hre) => {
    const { contractFactory, proxyAddress, action } = taskArgs;

    const Factory = (await hre.ethers.getContractFactory(
      contractFactory
    )) as ContractFactory;

    switch (action) {
      case 'prepare': {
        const oldImpl = await hre.upgrades.erc1967.getImplementationAddress(
          proxyAddress
        );
        const prepared = await hre.upgrades.prepareUpgrade(
          proxyAddress,
          Factory
        );
        console.log('old impl was: %s, new impl is: %s', oldImpl, prepared);
        break;
      }
      case 'exec': {
        const instance = await hre.upgrades.upgradeProxy(proxyAddress, Factory);
        console.log(
          `upgraded ${contractFactory} contract at %s`,
          instance.address
        );
        break;
      }
    }
  });
