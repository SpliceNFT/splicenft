import { NFTStorage, File } from 'nft.storage';
import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import fs from 'fs';

//pnpx hardhat --network localhost splice:style --account-idx 18 --style-nft-address 0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE --price-strategy-address 0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1  ../../renderers/ConfidenceInTheMission 0.05 200

task('splice:style', 'mints a style')
  .addParam('styleNftAddress')
  .addParam('priceStrategyAddress')
  .addOptionalParam('accountIdx', "the artist's account index", '0')
  .addPositionalParam('directory')
  .addPositionalParam('mintPriceEth')
  .addPositionalParam('cap')

  .setAction(async (taskArgs, hre) => {
    const {
      styleNftAddress,
      priceStrategyAddress,
      accountIdx,
      directory,
      mintPriceEth,
      cap
    } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const artist = signers[accountIdx];
    console.log('Artist', artist.address);

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFTV1');
    const styleNFT = await StyleNFT.attach(styleNftAddress);

    const artistMetadata = JSON.parse(
      await fs.promises.readFile(`${directory}/metadata.json`, 'utf-8')
    );
    const code = await fs.promises.readFile(`${directory}/code.js`);
    const previewImg = await fs.promises.readFile(`${directory}/preview.png`);

    const _metadata = { ...artistMetadata };

    _metadata.image = new File([previewImg], 'preview.png', {
      type: 'image/png'
    });

    _metadata.properties.code = new File([code], 'code.js', {
      type: 'application/javascript'
    });

    const nftStorageClient = new NFTStorage({
      token: process.env.NFTSTORAGE_APIKEY as string
    });

    const metadata = await nftStorageClient.store(_metadata);

    const cid = metadata.ipnft;
    console.debug('uploaded metadata', metadata.embed());
    console.log('metadata cid', cid);

    const minPriceWei = hre.ethers.utils.parseEther(mintPriceEth);
    const priceHex = minPriceWei.toHexString();
    const priceBytes = hre.ethers.utils.hexZeroPad(priceHex, 32);

    const mintArgs = {
      _cap: cap,
      _metadataCID: cid,
      _priceStrategy: priceStrategyAddress,
      _priceStrategyParameters: priceBytes
    };
    console.log('minting NFT with:', mintArgs);

    const receipt = await styleNFT
      .connect(artist)
      .mint(cap, cid, priceStrategyAddress, priceBytes);
    const confirmation = await receipt.wait();
    console.log('confirmation', confirmation);
  });
