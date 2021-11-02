import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

task('splice:tnft', 'mints on ENV.TESTNETNFT_CONTRACT_ADDRESS to <address>')
  .addParam('address')
  .setAction(async (taskArgs, hre) => {
    const { address } = taskArgs;

    const TestnetNFT = await hre.ethers.getContractFactory('TestnetNFT');

    const testnetNFT = await TestnetNFT.attach(
      process.env.TESTNETNFT_CONTRACT_ADDRESS as string
    );

    const receipt = await testnetNFT.mint(address);
    console.log(receipt);
  });
