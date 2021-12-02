import { ChainOpt } from '@splicenft/common';

const localContracts = process.env
  .REACT_APP_TESTNETNFT_CONTRACT_ADDRESS as string;

export const knownCollections: Record<ChainOpt, string[]> = {
  ethereum: [],
  rinkeby: [
    '0xF5aa8981E44a0F218B260C99F9C89Ff7C833D36e', //CC
    '0xd56c266c640F406db3B02C7054d2848252beE664', //DOODLE
    '0x25a1e017Ead38e2267593cE116d1E272Ba4D12c0', //Robotos
    '0xAF7209354132a3eab58D5CDef6FA28D98A27222E', //Lazy Lions
    '0xf36e7BC1dAe85ed18Cd492F9e856ACf2BD13398e', //Fly Frogs
    '0xf8b81E09cA0aae26FFC6B674988b103AD7d442d5', //Deadfellaz
    '0x149067b697D23944eD3dfEF972dCf91c6157Eb84' //Creature World
  ],
  kovan: [
    '0x6334d2cbC3294577BB9de58e8b1901d6e3b97681', //CC
    '0x6d96aAE79399C6f2630d585BBb0FCF31cCa88fa9', //BAYC
    '0xbC7708B459CAF31DA418f7F07AF89671CdB8c12C' //DEADFELLAZ
  ],
  localhost: localContracts.split(',')
};
