import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

//pnpx hardhat --network localhost style:sales --account-idx 18 --style 0x9A676e781A523b5d0C0e43731313A708CB607508 1 false

task('style:sales', 'toggles style sales')
  .addParam('style')
  .addOptionalParam('accountIdx', "the style minter's account index", '0')
  .addPositionalParam('styleTokenId')
  .addPositionalParam('salesIsActive')
  .setAction(async (taskArgs, hre) => {
    const {
      style: styleNftAddress,
      styleTokenId,
      salesIsActive,
      accountIdx
    } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const styleMinter = signers[accountIdx];

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFT');
    const styleNFT = await StyleNFT.attach(styleNftAddress).connect(
      styleMinter
    );

    const receipt = await styleNFT.toggleSaleIsActive(
      styleTokenId,
      salesIsActive === 'true' ? true : false
    );
    const confirmation = await receipt.wait();
    console.log('confirmation', confirmation.transactionHash);
  });
