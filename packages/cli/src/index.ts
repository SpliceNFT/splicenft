#!/usr/bin/env node

import { Command } from 'commander';
import { config as dotenvConfig } from 'dotenv-flow';
import { LoadImageNode, extractColors } from '@splicenft/colors';
import { logColors } from './logColors';

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

program.parseAsync(process.argv);
