import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

//pnpx hardhat --network localhost deploy:style --account-idx 18

task('deploy:style', 'deploys style')
  .addOptionalParam('accountIdx', "the deployer's account index", '0')
  .setAction(async (taskArgs, hre) => {
    const { accountIdx } = taskArgs;
    const signers = await hre.ethers.getSigners();
    const deployer = signers[accountIdx];

    const SpliceStyleNFTFactory = await hre.ethers.getContractFactory(
      'SpliceStyleNFT',
      deployer
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const spliceStyleNFT = await hre.upgrades.deployProxy(
      SpliceStyleNFTFactory,
      []
    );
    const receipt = spliceStyleNFT.deployTransaction;

    console.log(
      '[%s][%s] splice style nft: [%s]',
      deployer.address,
      receipt.hash,
      spliceStyleNFT.address
    );

    const tx = await receipt.wait();
    console.log('gas used: %s', tx.cumulativeGasUsed);
  });
