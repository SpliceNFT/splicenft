import { ethers } from 'ethers';
import derivatifArtefact from '../abis/Derivatif.json';

export const getInstance = (signer: ethers.Signer): ethers.Contract => {
  return new ethers.Contract(
    process.env.REACT_APP_DERIVATIF_CONTRACT_ADDRESS as string,
    derivatifArtefact.abi,
    signer
  );
};

export const startMinting = async (
  contract: ethers.Contract,
  originNftAddress: string,
  recipient: string
): Promise<number> => {
  const receipt = await contract.requestMint(originNftAddress, recipient);
  console.log(receipt);
  return 42;
};
