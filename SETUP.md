this project is based on [pnpm](https://pnpm.io) as a monorepo package manager. Because it's better, faster, slimmer than yarn or npm and supports monorepos without the lerna hassle and yarn incompatibilities right out of the box

### simple quickstart

```bash
pnpm install
cd packages/contracts
npx hardhat compile
npx hardhat console
```

### running tests

```bash
pnpm run test
# or
pnpx hardhat test
```

### using hardhat on a local network

```bash
pnpx hardhat node # runs a local node
# open a new window and...
pnpx hardhat run --network localhost scripts/deploy.js
# note the contract address
pnpx hardhat console --network localhost # launches a REPL
```

```js
const Greeter = await ethers.getContractFactory("Greeter");
const greeter = await Greeter.attach(
  "0x5fbdb2315678afecb367f032d93f642f64180aa3"
); //put your contract address here
await greeter.greet();
await greeter.setGreeting("Foo");
await greeter.greet();
```
