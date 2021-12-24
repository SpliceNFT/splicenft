import chalk from 'chalk';
import { RGB } from '@splicenft/common';

export function logColors(palette: RGB[]) {
  palette.forEach((h) => {
    console.log(chalk.rgb(h[0], h[1], h[2]).inverse(`   ${colorToHex(h)}    `));
  });
}

const colorToHex = (rgb: [number, number, number]): string =>
  `${Buffer.from([rgb[0]]).toString('hex')}${Buffer.from([rgb[1]]).toString(
    'hex'
  )}${Buffer.from([rgb[2]]).toString('hex')}`;
