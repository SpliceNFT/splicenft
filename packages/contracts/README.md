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

## hardhat tasks 

### Testnet NFT Minting

There's a "test nft" contract that allows you to allow mint arbitrary nfts. To mint an NFT from the command line for a recipient you first add the deployed NFTs address to your .env file and then

``` 
pnpx hardhat --network localhost splice:tnft --address 0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199
```
(use the address you like, this one is hh account #19)

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



