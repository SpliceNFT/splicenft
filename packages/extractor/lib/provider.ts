import { ethers } from "ethers";

export function getProvider(): ethers.providers.InfuraWebSocketProvider {
  // const provider = ethers.getDefaultProvider(network, {
  //   infura: process.env.INFURA_KEY as string,
  // });

  const provider = new ethers.providers.InfuraWebSocketProvider(
    process.env.ETH_NETWORK as string,
    process.env.INFURA_KEY as string
  );
  //const wallet = new ethers.Wallet(privateKey, provider);

  return provider;
}
