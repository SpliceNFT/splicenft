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

    const Splice = await ethers.getContractFactory('Splice');
    const splice = await upgrades.deployProxy(Splice, [
      'Splice',
      'SPLICE',
      'ipfs://',
      10000
    ]);
    console.log('Deployed splice contract:', splice.address);

    await splice.allowCollection(coolcatNft.address);
    console.log('allowed cool cats to mint splices');

    const p = [1, 2, 3, 4, 5].map((i) => coolcatNft.mint(lastAccount.address));
    await Promise.all(p);
    console.log('minted 5 NFTs to: ', lastAccount.address);
  })();
})();
