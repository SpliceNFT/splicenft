import fs from 'fs';

export function mkdir(address: string, tokenId: number | string): string {
  const directory = `./data/${address}/${tokenId}`;
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }
  return directory;
}
