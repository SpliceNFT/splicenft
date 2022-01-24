import '@nomiclabs/hardhat-ethers';
import { Event, constants } from 'ethers';
import fs from 'fs';
import { task } from 'hardhat/config';
import { File, NFTStorage } from 'nft.storage';

//pnpx hardhat --network localhost style:mint --account-idx 18 --style-nft-address 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 --price-strategy-address 0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0  ../../renderers/ConfidenceInTheMission 0.05 200 false 1

task('style:mint', 'mints a style')
  .addParam('styleNftAddress')
  .addParam('priceStrategyAddress')
  .addOptionalParam('accountIdx', '', '0')
  .addPositionalParam('directory')
  .addPositionalParam('mintPriceEth')
  .addPositionalParam('cap')
  .addPositionalParam('sale', 'is sale immediately active')
  .addPositionalParam('maxInputs', 'max collections allowed as input')

  .setAction(async (taskArgs, hre) => {
    const {
      styleNftAddress,
      priceStrategyAddress,
      accountIdx,
      directory,
      mintPriceEth,
      cap,
      sale,
      maxInputs
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

    const mintArgs = {
      _cap: cap,
      _metadataCID: cid,
      _priceStrategy: priceStrategyAddress,
      _sale: sale
    };
    console.log('minting style NFT with:', mintArgs);

    const receipt = await styleNFT.mint(
      cap,
      cid,
      priceStrategyAddress,
      sale === 'true' ? true : false,
      maxInputs,
      styleMinter.address,
      constants.AddressZero
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
