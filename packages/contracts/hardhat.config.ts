import '@nomiclabs/hardhat-waffle';
import { HardhatUserConfig, task } from 'hardhat/config';
import '@typechain/hardhat';
import 'tsconfig-paths/register';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import { config as dotenv } from 'dotenv-flow';
dotenv();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOYER_PRIVATEKEY as string]
    }
  },
  solidity: '0.8.4',
  typechain: {
    outDir: 'typechain',

    target: 'ethers-v5',
    externalArtifacts: ['artifacts/*.json'] // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    //externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_KEY
  }
};

export default config;
