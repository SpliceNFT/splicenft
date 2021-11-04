import { ethers } from 'hardhat';

(async () => {
  await (async () => {
    const TestnetNFT = await ethers.getContractFactory('TestnetNFT');
    const coolcatNft = await TestnetNFT.deploy(
      'Bored Apes Yacht Club Testnet',
      'BAYC',
      'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/',
      10000
    );

    console.log('Deployed cool cats :', coolcatNft.address);
  })();
})();

/*
    deployTestnetNFT(
      'Doodles Testnet',
      'DOODLES',
      'ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/',
      2000
    )*/

/*
    const coolcatNft = await TestnetNFT.deploy(
      'Cool Cats Testnet',
      'COOL',
      'https://api.coolcatsnft.com/cat/',
      10000
    );
    */
