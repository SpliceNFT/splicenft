import { ethers, upgrades, run } from 'hardhat';
import { SpliceStyleNFT } from '../typechain';

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

  await Promise.all([1, 2].map((i: number) => nft.mint(lastAccount.address)));

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
  const SpliceStyleNFT = await ethers.getContractFactory('SpliceStyleNFT');
  const spliceStyleNFT = (await upgrades.deployProxy(
    SpliceStyleNFT,
    []
  )) as SpliceStyleNFT;
  console.log('splice style nft:', spliceStyleNFT.address);

  const PaymentSplitterFactory = await ethers.getContractFactory(
    'PaymentSplitterController'
  );

  const paymentSplitterController = await upgrades.deployProxy(
    PaymentSplitterFactory,
    [spliceStyleNFT.address, []]
  );

  console.log(
    'payment splitter controller:',
    paymentSplitterController.address
  );
  await spliceStyleNFT.setPaymentSplitter(paymentSplitterController.address);

  const PriceStrategy = await ethers.getContractFactory(
    'SplicePriceStrategyStatic'
  );
  const staticPriceStrategy = await PriceStrategy.deploy(
    spliceStyleNFT.address
  );
  console.log('static price strategy:', staticPriceStrategy.address);

  const Splice = await ethers.getContractFactory('Splice');
  const splice = await upgrades.deployProxy(Splice, [
    'http://localhost:5999/splice/31337/',
    spliceStyleNFT.address
  ]);
  console.log('splice contract:', splice.address);

  await spliceStyleNFT.setSplice(splice.address);
  console.log('connected Splice & StyleNFT');

  //set some defaults
  await spliceStyleNFT.toggleStyleMinter(artistAccount.address, true);
  console.log('allowed style minter: ', artistAccount.address);

  for await (const style of [
    'ConfidenceInTheMission',
    'ABeginningIsAVeryDelicateTime',
    'District1618'
  ]) {
    await run('style:mint', {
      style: spliceStyleNFT.address,
      price: staticPriceStrategy.address,
      accountIdx: '18',
      directory: `../../renderers/${style}`,
      mintPriceEth: '0.02',
      cap: '200',
      maxInputs: '1',
      sale: true
    });
    console.log(`deployed style ${style}`);
  }
})();
