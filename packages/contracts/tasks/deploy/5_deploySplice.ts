import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

//pnpx hardhat --network localhost deploy:splice --account-idx 18 --backend "https://validate.getsplice.io/splice/4/" --style
// http://localhost:5999/splice/31337/

task('deploy:splice', 'deploys splice main contract')
  .addOptionalParam('accountIdx', "the deployer's account index", '0')
  .addParam('backend')
  .addParam('style')
  .setAction(async (taskArgs, hre) => {
    const { accountIdx, backend, style } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const deployer = signers[accountIdx];

    const SpliceFactory = await hre.ethers.getContractFactory(
      'Splice',
      deployer
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const splice = await hre.upgrades.deployProxy(SpliceFactory, [
      backend,
      style
    ]);
    const receipt = splice.deployTransaction;

    console.log('[%s] splice contract: [%s]', receipt.hash, splice.address);

    const tx = await receipt.wait();
    console.log('gas used: [%s]', tx.gasUsed);
  });
