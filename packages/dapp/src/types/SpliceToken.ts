import { Token } from 'nft.storage/dist/src/token';

export type SpliceToken = Token<{
  name: string;
  description: string;
  image: Blob;
  properties: {
    colors: Array<Array<number>>;
  };
}>;
