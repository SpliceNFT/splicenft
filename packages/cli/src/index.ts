#!/usr/bin/env node

import {
  extractColors,
  LoadImageNode,
  readImage,
  getFileType,
  palette,
  extractPaletteOld
} from '@splicenft/colors';
import { Command } from 'commander';
import { config as dotenvConfig } from 'dotenv-flow';
import fs from 'fs';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { logColors } from './logColors.js';
import rgbHex from 'rgb-hex';
import { RGB } from '@splicenft/common';
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
  const colors = await extractColors(imgUrl, LoadImageNode, {});
  logColors(colors);
});

const xcol = async (file: string) => {
  try {
    const bin = await fs.promises.readFile(`./data/${file}`);
    const ft = await getFileType(bin);
    const flatPixels = Array.from(await readImage(ft.mime, bin));
    const extracted = palette({
      saturationWeight: 0.4,
      distance: 0.125,
      pixels: flatPixels.length / 16,
      accuracy: 12
    })(flatPixels);
    const old = extractPaletteOld(flatPixels);

    return {
      file,
      extracted,
      colors: extracted.map((x) => [x.red, x.green, x.blue] as RGB),
      hex: extracted.map((x) => rgbHex(x.red, x.green, x.blue)),
      old: old.map((x) => rgbHex(x[0], x[1], x[2]))
    };
  } catch (e: any) {
    console.error(`${file}: ${e.message}`);
    return { file, extracted: [], colors: [], hex: [] };
  }
};

program.command('all').action(async (csv: string) => {
  const loader = new TwingLoaderFilesystem('src');
  const twing = new TwingEnvironment(loader);

  const files = await fs.promises.readdir('./data');
  const promises = files.map(xcol);

  const images = await Promise.all(promises);
  //images.map((img) => logColors(img.colors));

  const rendered = await twing.render('multi.twig', { images });
  await fs.promises.writeFile('./data/out.html', rendered);

  // const colors = await extractColors(imgUrl, LoadImageNode, {});
});

program.parseAsync(process.argv);
