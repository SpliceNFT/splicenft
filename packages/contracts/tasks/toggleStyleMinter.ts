import '@nomiclabs/hardhat-ethers';
import { task, types } from 'hardhat/config';

//pnpx hardhat --network localhost role:minter --account-idx 18 --style --minter 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 true

task('role:minter', 'toggles style minter status')
  .addOptionalParam('accountIdx', 'the style contract owner ', '0')
  .addParam('style')
  .addParam('minter')
  .addPositionalParam('active', 'a bool', false, types.boolean)
  .setAction(async (taskArgs, hre) => {
    const { style, minter, active, accountIdx } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const owner = signers[accountIdx];

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFT');
    const styleNFT = await StyleNFT.attach(style).connect(owner);

    const receipt = await styleNFT.toggleStyleMinter(minter, active);
    console.log(
      `[${receipt.hash}] ${minter} is now ${active ? '' : 'not'} a styleminter`
    );

    const tx = await receipt.wait();
    console.log('gas: [%s]', tx.gasUsed);
  });
