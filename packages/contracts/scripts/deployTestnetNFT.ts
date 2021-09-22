import { ethers } from 'hardhat';

(async () => {
  await (async () => {
    const TestnetNFT = await ethers.getContractFactory('TestnetNFT');
    const coolcatNft = await TestnetNFT.deploy(
      'Cool Cats Testnet',
      'COOL',
      'https://api.coolcatsnft.com/cat/',
      10000
    );

    console.log('Deployed cool cats :', coolcatNft.address);
  })();
})();
