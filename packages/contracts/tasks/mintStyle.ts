import '@nomiclabs/hardhat-ethers';
import { Event, constants } from 'ethers';
import fs from 'fs';
import { task, types } from 'hardhat/config';
import { File, NFTStorage } from 'nft.storage';

//pnpx hardhat --network localhost style:mint --account-idx 18 --style 0x9A676e781A523b5d0C0e43731313A708CB607508 --price 0x68B1D87F95878fE05B998F19b66F4baba5De1aed  ../../renderers/ConfidenceInTheMission 0.05 200 1 false
//pnpx hardhat --network localhost style:mint --account-idx 18 --style 0x9A676e781A523b5d0C0e43731313A708CB607508 --price 0x68B1D87F95878fE05B998F19b66F4baba5De1aed --artist 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC --partner 0x90F79bf6EB2c4f870365E785982E1f101E93b906 ../../renderers/TheGardenOfEarthlyDelights/ 0.1 50 1 false
// pnpx hardhat --network localhost style:mint --account-idx 18 --style 0x9A676e781A523b5d0C0e43731313A708CB607508 --price 0x68B1D87F95878fE05B998F19b66F4baba5De1aed --artist 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC ../../renderers/TheGardenOfEarthlyDelights/ 0.2 50 1 true

task('style:mint', 'mints a style')
  .addParam('style', 'the style contract')
  .addParam('price', 'the price contract')
  .addOptionalParam('accountIdx', '', '0')
  .addOptionalParam('artist', 'the first owner')
  .addOptionalParam('partner', 'a potential partner')
  .addPositionalParam('directory')
  .addPositionalParam('mintPriceEth')
  .addPositionalParam('cap')
  .addPositionalParam('maxInputs', 'max collections allowed as input')
  .addPositionalParam(
    'sale',
    'is sale immediately active',
    false,
    types.boolean
  )

  .setAction(async (taskArgs, hre) => {
    const {
      style: styleNftAddress,
      price: priceStrategyAddress,
      accountIdx,
      directory,
      mintPriceEth,
      cap,
      sale,
      maxInputs,
      artist,
      partner
    } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const styleMinter = signers[accountIdx];
    console.log('Style Minter: ', styleMinter.address);

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFT');
    const styleNFT = await StyleNFT.attach(styleNftAddress).connect(
      styleMinter
    );

    const styleMetadata = JSON.parse(
      await fs.promises.readFile(`${directory}/metadata.json`, 'utf-8')
    );
    const code = await fs.promises.readFile(`${directory}/code.js`);
    const previewImg = await fs.promises.readFile(`${directory}/preview.png`);

    const _metadata = { ...styleMetadata };

    _metadata.image = new File([previewImg], 'preview.png', {
      type: 'image/png'
    });

    _metadata.code = new File([code], 'code.js', {
      type: 'application/javascript'
    });

    const nftStorageClient = new NFTStorage({
      token: process.env.NFTSTORAGE_APIKEY as string
    });

    const metadata = await nftStorageClient.store(_metadata);

    const cid = metadata.ipnft;
    console.log('uploaded metadata, cid: ', cid);

    const receipt = await styleNFT.mint(
      cap,
      cid,
      priceStrategyAddress,
      sale,
      maxInputs,
      artist ?? constants.AddressZero,
      partner ?? constants.AddressZero
    );

    const confirmation = await receipt.wait();

    const transferEvent = confirmation.events?.find(
      (e: Event) => e.event === 'Transfer'
    );
    if (transferEvent === undefined || transferEvent.args === undefined) {
      throw 'no transfer event';
    }
    const tokenId = transferEvent.args.tokenId;

    console.log('minted [%s] at [%s]', tokenId, confirmation.transactionHash);
    const mintPriceWei = hre.ethers.utils.parseEther(mintPriceEth);

    const PriceFactory = await hre.ethers.getContractFactory(
      'SplicePriceStrategyStatic'
    );
    const priceStrategy = await PriceFactory.attach(
      priceStrategyAddress
    ).connect(styleMinter);

    const priceTx = await priceStrategy.setPrice(tokenId, mintPriceWei);
    await priceTx.wait();
    console.log(
      'set price for [%s] to [%s] at [%s]',
      tokenId,
      mintPriceWei,
      priceTx.hash
    );
  });
