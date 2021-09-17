async function main() {
  // We get the contract to deploy
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Hardhat!");

  console.log("Greeter deployed to:", greeter.address);
}

(async function () {
  await main();
})();
