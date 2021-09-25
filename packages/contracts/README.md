# Contracts

we're using [hardhat](https://hardhat.org/getting-started/#overview). It's fast.

```shell
pnpx hardhat node # runs a local node
# open a new window and...
pnpx hardhat run --network localhost scripts/deploy.js
# note the contract address
pnpx hardhat console --network localhost # launches a REPL
```

### interacting with contracts on the local node

```js
const Greeter = await ethers.getContractFactory("Greeter");
const greeter = await Greeter.attach(
  "0x5fbdb2315678afecb367f032d93f642f64180aa3"
); //put your contract address here
await greeter.greet();
await greeter.setGreeting("Foo");
await greeter.greet();
```

### hardhat tasks to (simple) mint NFTs

There's a "test nft" contract that allows you to allow mint "arbitrary" nfts (simulates cool cats). To mint an NFT from the command line you can

``` 
pnpx hardhat --network localhost nft:mint --address <0xaddress>
```

