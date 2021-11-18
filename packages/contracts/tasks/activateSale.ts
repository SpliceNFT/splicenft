import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

//pnpx hardhat --network localhost style:sales --account-idx 18 --style-nft-address 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 1 false

task('style:sales', 'toggles style sales')
  .addParam('styleNftAddress')
  .addOptionalParam('accountIdx', "the curator's account index", '0')
  .addPositionalParam('styleTokenId')
  .addPositionalParam('salesIsActive')
  .setAction(async (taskArgs, hre) => {
    const { styleNftAddress, styleTokenId, salesIsActive, accountIdx } =
      taskArgs;

    const signers = await hre.ethers.getSigners();
    const curator = signers[accountIdx];

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFT');
    const styleNFT = await StyleNFT.attach(styleNftAddress).connect(curator);

    const receipt = await styleNFT.toggleSaleIsActive(
      styleTokenId,
      salesIsActive === 'true' ? true : false
    );
    const confirmation = await receipt.wait();
    console.log('confirmation', confirmation.transactionHash);
  });
