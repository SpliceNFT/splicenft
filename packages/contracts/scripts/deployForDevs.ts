import { ethers, upgrades } from 'hardhat';

(async () => {
  await (async () => {
    const accounts = await ethers.getSigners();
    const lastAccount = accounts[accounts.length - 1];

    const TestnetNFT = await ethers.getContractFactory('TestnetNFT');
    const coolcatNft = await TestnetNFT.deploy(
      'Cool Cats Testnet',
      'COOL',
      'https://api.coolcatsnft.com/cat/',
      10000
    );
    console.log('Deployed cool cats :', coolcatNft.address);

    const deadFellazNft = await TestnetNFT.deploy(
      'DeadFellaz Testnet',
      'DEADFELLAZ',
      'https://api.deadfellaz.io/traits/',
      10000
    );
    console.log('Deployed DeadFellaz :', deadFellazNft.address);

    const flyFrogs = await TestnetNFT.deploy(
      'FlyFrogs Testnet',
      'FLYFROGS',
      'ipfs://QmRdNB3Q6Q5gVWnduBmxNZb4p9zKFmM3Qx3tohBb8B2KRK/',
      10000
    );
    console.log('Deployed FlyFrogs:', flyFrogs.address);

    const Splice = await ethers.getContractFactory('Splice');
    const splice = await upgrades.deployProxy(Splice, ['Splice', 'SPLICE']);
    console.log('Deployed splice contract:', splice.address);

    await splice.allowCollection(coolcatNft.address, 10000);
    console.log('allowed cool cats to mint splices');

    const p = [1, 2, 3, 4, 5].map((i) => coolcatNft.mint(lastAccount.address));

    await Promise.all(p);
    console.log('minted 5 cool cat NFTs to: ', lastAccount.address);

    const q = [1, 2, 3].map((i) => deadFellazNft.mint(lastAccount.address));
    await Promise.all(q);
    console.log('minted 3 dead fellaz NFTs to: ', lastAccount.address);
  })();
})();
