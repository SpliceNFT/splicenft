import { BaseProvider } from ".pnpm/@ethersproject/providers@5.4.5/node_modules/@ethersproject/providers";
import { ethers } from "ethers";

export function getProvider(): BaseProvider {
  const network = process.env.ETH_NETWORK as string;

  const provider = ethers.getDefaultProvider(network, {
    infura: process.env.INFURA_KEY as string,
  });

  //const wallet = new ethers.Wallet(privateKey, provider);

  return provider;
}
