# Contracts

we're using [hardhat](https://hardhat.org/getting-started/#overview). It's fast.

```bash
pnpm run build
```

will compile and generate typechain code.

```bash
pnpx hardhat test
```

executes the test suite with code coverage and gas cost estimation.

## using hardhat on a local network

```bash
pnpx hardhat node # runs a local node
# open a new window and...
pnpx hardhat run --network localhost scripts/deployForDevs.js
# deploys test nfts, all splice contracts and styles on your local node
pnpx hardhat console --network localhost # launches a REPL
```

## Deployment tasks

### Deploy Style

```
pnpx hardhat --network localhost deploy:style
```

### Deploy payment controller

```
//main 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,0x6B175474E89094C44Da98b954EedeAC495271d0F,0xdAC17F958D2ee523a2206206994597C13D831ec7
//rinkeby 0xc3dbf84Abb494ce5199D5d4D815b10EC29529ff8,0xc778417E063141139Fce010982780140Aa0cD5Ab

pnpx hardhat --network localhost deploy:payments  --erc20 "" --style
```

### Bind payment controller to style

```
pnpx hardhat --network localhost deploy:bindpayments  --style  --payment
```

### Deploy price strategy

```
pnpx hardhat --network localhost deploy:price  --style
```

### Deploy Splice

```
//main "https://validate.getsplice.io/splice/1/"
//rinkeby "https://validate.getsplice.io/splice/4/"
//local "http://localhost:5999/splice/31337/"
pnpx hardhat --network localhost deploy:splice  --backend  --style
```

### Bind Style to Splice

```
pnpx hardhat --network localhost deploy:bindsplice  --splice   --style
```

#### Enable a style minter

```
//local artist: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC #3
//local minter: 0xdD2FD4581271e230360230F9337D5c0430Bf44C0 #18

pnpx hardhat --network localhost role:minter  --style --minter 0xdD2FD4581271e230360230F9337D5c0430Bf44C0 true
```

#### Deploy a style

```
pnpx hardhat --network localhost style:mint --account-idx 18 --style  --price  --artist  ../../renderers/TheGardenOfEarthlyDelights/ 0.2 50 1 true

// with partnership
pnpx hardhat --network localhost style:mint --account-idx 18 --style  --price  --artist  --partner  ../../renderers/TheGardenOfEarthlyDelights/ 0.1 50 1 false

pnpx hardhat --network localhost style:partnership --account-idx 18 --style --collections   1 2022-01-26 true

pnpx hardhat --network localhost style:sales --account-idx 18 --style-nft-address 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 1 false
```

## hardhat tasks

### Mint a Style NFT

```bash
pnpx hardhat --network localhost style:mint --account-idx 18 --style-nft-address 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 --price-strategy-address 0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0  ../../renderers/ConfidenceInTheMission 0.05 200 false
```

`account-idx` (optional): the account index of your wallet that must be an active style minter of the Style NFT contract (only accounts with this role may mint Style NFTs). If not provided we use the first one. On Public Testnets we're using private keys that you can provide in your .env file (`DEPLOYER_PRIVATEKEY`).

the positional parameters are

- the location of a style code / metadata bundle (see this repository's `/renderers` folder)
- the minting fee
- the style cap
- bool: is style on sale

### Activate sales on a minted Style NFT

```bash
pnpx hardhat --network localhost style:sales --account-idx 18 --style-nft-address 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 1 false
```

## Verify a contract on chain

```
pnpx hardhat verify --network rinkeby --contract contracts/Splice.sol:Splice 0xEa934c468e6c8c0C60E6E62797ae57dBD601970f  "Splice" "SPLICE" "https://validate.getsplice.io/splice/4/"
```
