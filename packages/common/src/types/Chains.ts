export const CHAINS: Record<number, ChainOpt> = {
  1: 'ethereum',
  4: 'rinkeby',
  42: 'kovan',
  31337: 'localhost'
};
export type ChainOpt = 'ethereum' | 'rinkeby' | 'kovan' | 'localhost';
