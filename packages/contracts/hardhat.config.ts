/* eslint-disable @typescript-eslint/no-explicit-any */
import '@nomiclabs/hardhat-waffle';
import { HardhatUserConfig, task } from 'hardhat/config';
import '@typechain/hardhat';
import 'tsconfig-paths/register';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';

import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import 'hardhat-tracer';
import 'solidity-coverage';

import './tasks/activateSale';
import './tasks/upgrades';
import './tasks/mintStyle';
import './tasks/enablePartnership';
import './tasks/toggleStyleMinter';

import './tasks/deploy/1_deployStyle';
import './tasks/deploy/2_deployPaymentSplitter';
import './tasks/deploy/3_bindPayments';
import './tasks/deploy/4_deployPriceStrategy';
import './tasks/deploy/5_deploySplice';
import './tasks/deploy/6_bindSpliceStyle';

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
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: {
        initialIndex: 0,
        mnemonic: process.env.DEPLOYER_MNEMONIC as string
      }
    },
    // hardhat: {
    //   gas: 12000000,
    //   blockGasLimit: 0x1fffffffffffff,
    //   allowUnlimitedContractSize: true
    // },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOYER_PRIVATEKEY as string]
      //https://hardhat.org/config/
      //gasPrice: 100000000000
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOYER_PRIVATEKEY as string]
    }
  },
  solidity: {
    version: '0.8.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
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
  },
  gasReporter: {
    currency: 'EUR',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
};

export default config;
