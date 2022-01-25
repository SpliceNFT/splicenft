import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

//pnpx hardhat --network localhost deploy:price --account-idx 18 --style

task('deploy:price', 'deploys price strategy')
  .addOptionalParam('accountIdx', "the deployer's account index", '0')
  .addParam('style')
  .setAction(async (taskArgs, hre) => {
    const { accountIdx, style } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const deployer = signers[accountIdx];

    const PriceStrategyFactory = await hre.ethers.getContractFactory(
      'SplicePriceStrategyStatic',
      deployer
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const staticPriceStrategy = await PriceStrategyFactory.deploy(style);
    const receipt = staticPriceStrategy.deployTransaction;

    console.log(
      '[%s] price strategy: [%s]',
      receipt.hash,
      staticPriceStrategy.address
    );

    const tx = await receipt.wait();
    console.log('gas used: [%s]', tx.gasUsed);
  });
