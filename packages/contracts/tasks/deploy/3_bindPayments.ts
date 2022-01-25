import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

//pnpx hardhat --network localhost deploy:bindpayments --account-idx 18 --style  --payment

task('deploy:bindpayments', 'binds paymentsplitter to style')
  .addOptionalParam('accountIdx', "the deployer's account index", '0')
  .addParam('style')
  .addParam('payment')
  .setAction(async (taskArgs, hre) => {
    const { accountIdx, style, payment } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const deployer = signers[accountIdx];

    const SpliceStyleNFTFactory = await hre.ethers.getContractFactory(
      'SpliceStyleNFT',
      deployer
    );
    const styleNft = SpliceStyleNFTFactory.attach(style);

    const receipt = await styleNft.setPaymentSplitter(payment);

    console.log(
      '[%s] bound paymentsplitter [%s] to style contract [%s]',
      receipt.hash,
      payment,
      style
    );
    const tx = await receipt.wait();
    console.log('gas: [%s]', tx.gasUsed);
  });
