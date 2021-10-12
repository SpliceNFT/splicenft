import { KnownCollections } from '@splicenft/common';

const localContracts = process.env
  .REACT_APP_TESTNETNFT_CONTRACT_ADDRESS as string;

export const knownCollections: KnownCollections = {
  ethereum: [],
  rinkeby: [
    '0xF5aa8981E44a0F218B260C99F9C89Ff7C833D36e', //CC
    '0xe85C716577A58d637ddA647caf42Bc5a6cBA2e95' //SSS
  ],
  kovan: [
    '0x6334d2cbC3294577BB9de58e8b1901d6e3b97681', //CC
    '0x6d96aAE79399C6f2630d585BBb0FCF31cCa88fa9', //BAYC
    '0xbC7708B459CAF31DA418f7F07AF89671CdB8c12C' //DEADFELLAZ
  ],
  localhost: localContracts.split(',')
};

// export const getKnownNFTs = (chain: Chains.ChainOpt) => {
//   return knownContracts[chain];
// };
