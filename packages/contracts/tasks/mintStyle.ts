import { NFTStorage, File } from 'nft.storage';
import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import fs from 'fs';

//pnpx hardhat --network localhost splice:style --account-idx 18 --style-nft-address 0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE --price-strategy-address 0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1  Confidence ../common/src/renderers/ConfidenceInTheMission.js ../../artwork/confidence.png 0.05 200

task('splice:style', 'mints a style')
  .addParam('styleNftAddress')
  .addParam('priceStrategyAddress')
  .addOptionalParam('accountIdx', "the artist's account index", '0')
  .addPositionalParam('styleName')
  .addPositionalParam('codePath')
  .addPositionalParam('stylePreviewImagePath')
  .addPositionalParam('mintPriceEth')
  .addPositionalParam('cap')

  .setAction(async (taskArgs, hre) => {
    const {
      styleNftAddress,
      priceStrategyAddress,
      accountIdx,
      styleName,
      codePath,
      stylePreviewImagePath,
      mintPriceEth,
      cap
    } = taskArgs;

    const signers = await hre.ethers.getSigners();
    const artist = signers[accountIdx];
    console.log('Artist', artist.address);

    const StyleNFT = await hre.ethers.getContractFactory('SpliceStyleNFTV1');
    const styleNFT = await StyleNFT.attach(styleNftAddress);

    const code = await fs.promises.readFile(codePath);
    const previewImg = await fs.promises.readFile(stylePreviewImagePath);

    const nftStorageClient = new NFTStorage({
      token: process.env.NFTSTORAGE_APIKEY as string
    });

    const metadata = await nftStorageClient.store({
      name: 'ConfidenceInTheMission',
      description: `ConfidenceInTheMission generates an abstraction of the interior of HAL, from 2001 Space Odyssey.
       It draws two grids of rectangles on top of one another:
       1. a main grid that angles with one-point perspective, has a wide dark gap in the vertical middle,
       and fades in towards the vertical middle of the canvas and
       2. a grid that's flat, fully saturated, and displays blocks of rects of various colors.
      `,
      image: new File([previewImg], 'preview.png', { type: 'image/png' }),
      properties: {
        creator_name: 'Emily Weil',
        creator_twitter: '@emilyaweil',
        code_library: 'p5.js',
        code_library_version: '1.4.0',
        code: new File([code], 'code.js', {
          type: 'application/javascript'
        })
      }
    });

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
