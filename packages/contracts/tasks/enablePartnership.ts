import '@nomiclabs/hardhat-ethers';
import { task, types } from 'hardhat/config';

//pnpx hardhat --network localhost style:partnership --account-idx 18 --style 0x9A676e781A523b5d0C0e43731313A708CB607508 --collections 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 1 2022-01-26 true
task('style:partnership', 'enables partnership')
  .addParam('style')
  .addOptionalParam('accountIdx', "the style minter's account index", '0')
  .addParam<string>('collections', 'comma separated', undefined)
  .addPositionalParam<string>('styleTokenId')
  .addPositionalParam<string>('until', '2022-05-01')
  .addPositionalParam('exclusive', 'a bool', false, types.boolean)

  .setAction(async (taskArgs, hre) => {
    const {
      style: styleNftAddress,
      accountIdx,
      collections: collections_,
      styleTokenId,
      until: until_,
      exclusive
    } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const styleMinter = signers[accountIdx];

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFT');
    const styleNFT = await StyleNFT.attach(styleNftAddress).connect(
      styleMinter
    );

    const untilTS = Date.parse(until_);
    if (Number.isNaN(untilTS)) {
      throw `couldnt parse date ${until_}`;
    }
    const until = new Date(untilTS);

    const collections = collections_.split(',');
    for (const c of collections) {
      if (!hre.ethers.utils.isAddress(c)) {
        throw `${c} is not a (valid) address`;
      }
    }

    console.log({
      collections,
      styleTokenId,
      until,
      ts: untilTS / 1000,
      exclusive
    });

    const receipt = await styleNFT.enablePartnership(
      collections,
      styleTokenId,
      untilTS / 1000,
      exclusive
    );

    const confirmation = await receipt.wait();
    console.log('partnership enabled', confirmation.transactionHash);
  });
