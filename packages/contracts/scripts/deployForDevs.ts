import { ethers, upgrades } from 'hardhat';

const deployTestnetNFT = async (
  name: string,
  symbol: string,
  baseUri: string,
  limit: number
): Promise<string> => {
  const accounts = await ethers.getSigners();
  const lastAccount = accounts[accounts.length - 1];

  const TestnetNFT = await ethers.getContractFactory('TestnetNFT');
  const nft = await TestnetNFT.deploy(name, symbol, baseUri, limit);

  await Promise.all(
    [1, 2, 3].map((i: number) => nft.mint(lastAccount.address))
  );

  return nft.address;
};

(async () => {
  const accounts = await ethers.getSigners();
  const artistAccount = accounts[accounts.length - 2];

  // deploy testnet nfts
  const nftDeploys = [
    deployTestnetNFT(
      'Cool Cats Testnet',
      'COOL',
      'https://api.coolcatsnft.com/cat/',
      10000
    ),
    deployTestnetNFT(
      'DeadFellaz Testnet',
      'DEADFELLAZ',
      'https://api.deadfellaz.io/traits/',
      10000
    ),
    deployTestnetNFT(
      'FlyFrogs Testnet',
      'FLYFROGS',
      'ipfs://QmRdNB3Q6Q5gVWnduBmxNZb4p9zKFmM3Qx3tohBb8B2KRK/',
      10000
    ),
    deployTestnetNFT(
      'Doodles Testnet',
      'DOODLES',
      'ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/',
      2000
    )
  ];

  const nfts = await Promise.all(nftDeploys);

  console.log(
    'put this into your dapp/.env/REACT_APP_TESTNETNFT_CONTRACT_ADDRESS: ',
    nfts.join(',')
  );

  // deploy splice infra
  const PriceStrategy = await ethers.getContractFactory(
    'SplicePriceStrategyStatic'
  );
  const staticPriceStrategy = await PriceStrategy.deploy();
  console.log('static price strategy instance:', staticPriceStrategy.address);

  const SpliceStyleNFT = await ethers.getContractFactory('SpliceStyleNFTV1');
  const spliceStyleNFT = await SpliceStyleNFT.deploy();
  console.log('splice style nft:', spliceStyleNFT.address);

  const Splice = await ethers.getContractFactory('Splice');
  const splice = await upgrades.deployProxy(Splice, ['Splice', 'SPLICE']);
  console.log('splice contract:', splice.address);

  const r = await splice.setStyleNFT(spliceStyleNFT.address);
  const q = await spliceStyleNFT.setSplice(splice.address);
  console.log('connected Splice & StyleNFT');

  //set some defaults
  await spliceStyleNFT.allowArtist(artistAccount.address);
  console.log('allowed artist: ', artistAccount.address);

  await splice.toggleSaleIsActive(true);

  await splice.allowCollections([nfts[0], nfts[1]]);
  console.log('allowed minting collections:', nfts[0], nfts[1]);

  await splice.addValidator(accounts[0].address);
  console.log('added validator', accounts[0].address);
})();
