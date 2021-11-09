import { ethers } from 'hardhat';

(async () => {
  await (async () => {
    const TestnetNFT = await ethers.getContractFactory('TestnetNFT');
    const testnetNft = await TestnetNFT.deploy(
      'Creature World Testnet',
      'CREATURE',
      'ipfs://QmeoHYZKedBUn5psxdUtgtmt4s1mDgwTUtpF4k31pDLQdp/',
      10000
    );

    console.log('Deployed testnet nft:', testnetNft.address);
  })();
})();

/*
'Robotos Testnet',
      'ROBO',
      'ipfs://QmQh36CsceXZoqS7v9YQLUyxXdRmWd8YWTBUz7WCXsiVty/',
      9999

      'Lazy Lions Testnet',
      'LION',
      'https://www.lazylionsnft.com/api/',
      10000

      'FlyFrogs Testnet',
      'FLYFROGS',
      'ipfs://QmRdNB3Q6Q5gVWnduBmxNZb4p9zKFmM3Qx3tohBb8B2KRK/',
      10000

      'DeadFellaz Testnet',
      'DEADFELLAZ',
      'https://api.deadfellaz.io/traits/',
      10000

      'Creature World Testnet',
      'CREATURE',
      'ipfs://QmeoHYZKedBUn5psxdUtgtmt4s1mDgwTUtpF4k31pDLQdp/',
      10000

      'Doodles Testnet',
      'DOODLES',
      'ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/',
      10000

      'Cool Cats Testnet',
      'COOL',
      'https://api.coolcatsnft.com/cat/',
      10000

*/
