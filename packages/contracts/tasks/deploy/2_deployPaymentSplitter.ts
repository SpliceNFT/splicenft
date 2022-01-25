import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

// WETH9, USDC, DAI, USDT
// 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,0x6B175474E89094C44Da98b954EedeAC495271d0F,0xdAC17F958D2ee523a2206206994597C13D831ec7

//pnpx hardhat --network localhost deploy:payments --account-idx 18 --erc20 "" --style

task('deploy:payments', 'deploys paymentsplitters')
  .addOptionalParam('accountIdx', "the deployer's account index", '0')
  .addParam('erc20', 'known payment tokens comma separated')
  .addParam('style')
  .setAction(async (taskArgs, hre) => {
    const { accountIdx, style, erc20 } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const deployer = signers[accountIdx];

    const paymentTokens = erc20.length == 0 ? [] : erc20.split(',');

    const PaymentSplitterFactory = await hre.ethers.getContractFactory(
      'PaymentSplitterController',
      deployer
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const paymentSplitterController = await hre.upgrades.deployProxy(
      PaymentSplitterFactory,
      [style, paymentTokens]
    );
    const receipt = paymentSplitterController.deployTransaction;

    console.log(
      '[%s] payment splitter controller: [%s]',
      receipt.hash,
      paymentSplitterController.address
    );

    const tx = await receipt.wait();
    console.log('gas used: [%s]', tx.gasUsed);
  });
