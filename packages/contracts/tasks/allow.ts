import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

task('splice:allow', 'allows a collection')
  .addPositionalParam('collection')
  .setAction(async (taskArgs, hre) => {
    const { collection } = taskArgs;

    const Splice = await hre.ethers.getContractFactory('Splice');

    const splice = await Splice.attach(
      process.env.SPLICE_CONTRACT_ADDRESS as string
    );
    const receipt = await (await splice.allowCollections([collection])).wait();
    console.log(receipt);
  });
