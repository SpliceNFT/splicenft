import '@nomiclabs/hardhat-ethers';
import fs from 'fs';
import { task } from 'hardhat/config';
import { File, NFTStorage } from 'nft.storage';

//pnpx hardhat --network localhost style:mint --account-idx 18 --style-nft-address 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 --price-strategy-address 0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0  ../../renderers/ConfidenceInTheMission 0.05 200 false

task('style:mint', 'mints a style')
  .addParam('styleNftAddress')
  .addParam('priceStrategyAddress')
  .addOptionalParam('accountIdx', '', '0')
  .addPositionalParam('directory')
  .addPositionalParam('mintPriceEth')
  .addPositionalParam('cap')
  .addPositionalParam('sale', 'is sale immediately active')

  .setAction(async (taskArgs, hre) => {
    const {
      styleNftAddress,
      priceStrategyAddress,
      accountIdx,
      directory,
      mintPriceEth,
      cap,
      sale
    } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const curator = signers[accountIdx];
    console.log('Curator', curator.address);

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFT');
    const styleNFT = await StyleNFT.attach(styleNftAddress).connect(curator);

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

    const minPriceWei = hre.ethers.utils.parseEther(mintPriceEth);
    const priceHex = minPriceWei.toHexString();
    const priceBytes = hre.ethers.utils.hexZeroPad(priceHex, 32);

    const mintArgs = {
      _cap: cap,
      _metadataCID: cid,
      _priceStrategy: priceStrategyAddress,
      _priceStrategyParameters: priceBytes,
      _sale: sale
    };
    console.log('minting NFT with:', mintArgs);

    const receipt = await styleNFT.mint(
      cap,
      cid,
      priceStrategyAddress,
      priceBytes,
      sale === 'true' ? true : false
    );
    const confirmation = await receipt.wait();
    console.log('confirmation', confirmation.transactionHash);
  });
