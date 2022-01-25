import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

//pnpx hardhat --network localhost deploy:bindsplice --account-idx 18 --splice   --style

task('deploy:bindsplice', 'binds paymentsplitter to style')
  .addOptionalParam('accountIdx', "the deployer's account index", '0')
  .addParam('splice')
  .addParam('style')
  .setAction(async (taskArgs, hre) => {
    const { accountIdx, style, splice } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const deployer = signers[accountIdx];

    const StyleFactory = await hre.ethers.getContractFactory(
      'SpliceStyleNFT',
      deployer
    );
    const styleNft = StyleFactory.attach(style);

    const receipt = await styleNft.setSplice(splice);

    console.log(
      '[%s] bound splice [%s] to style contract [%s]',
      receipt.hash,
      splice,
      style
    );
    const tx = await receipt.wait();
    console.log('gas: [%s]', tx.gasUsed);
  });
