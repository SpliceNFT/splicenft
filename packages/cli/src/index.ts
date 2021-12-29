#!/usr/bin/env node

import { extractColors, LoadImageNode, rgbToHex } from '@splicenft/colors';

import { Command } from 'commander';
import { config as dotenvConfig } from 'dotenv-flow';
import fs from 'fs';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { logColors } from './logColors.js';

dotenvConfig();

const program = new Command();
program.version('0.0.1').name('nft');

// program
//   .command('fetch <nftAddressAndTokenId>')
//   .description(
//     'fetches nft meta data. Make sure to set the respective authorization keys in your environment'
//   )
//   .action(async (nftAddressAndTokenId: string) => {
//     const [nftAddress, tokenId] = nftAddressAndTokenId.split('/');
//     spinner.info(`fetching #${tokenId} from ${nftAddress}`);
//     await fetchNFTMetaData(nftAddress, tokenId);
//   });

program.command('colors <imgurl>').action(async (imgUrl: string) => {
  const histogram = await extractColors(imgUrl, LoadImageNode, {});
  logColors(histogram.map((h) => h.rgb));
});

const xcol = async (file: string) => {
  if (file.endsWith('.html')) return null;
  try {
    const histogram = await extractColors(`./data/${file}`, LoadImageNode, {});

    // const scaledRgba = await pica().resizeBuffer({
    //   src: img.rgb,
    //   width: img.dims.w,
    //   height: img.dims.h,
    //   toWidth: 300,
    //   toHeight: Math.floor((300 * img.dims.h) / img.dims.w)
    // });
    // await writePngFile(
    //   `./data/scaled/${file}.png`,
    //   Buffer.from(quantizedImage.toUint8Array()),
    //   {
    //     width: quantizedImage.getWidth(),
    //     height: quantizedImage.getHeight()
    //   }
    // );

    return {
      file,
      histogram
    };
  } catch (e: any) {
    console.error(`${file}: ${e.message}`);
    return { file, histogram: [] };
  }
};

program.command('all').action(async () => {
  const loader = new TwingLoaderFilesystem('src');
  const twing = new TwingEnvironment(loader);

  const files = await fs.promises.readdir('./data');
  const promises = files.map(xcol);

  const images = await Promise.all(promises);

  const rendered = await twing.render('multi.twig', { images });
  await fs.promises.writeFile('./data/out.html', rendered);
});

program.parseAsync(process.argv);
