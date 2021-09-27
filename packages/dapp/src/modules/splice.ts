import { ethers } from 'ethers';
import spliceArtefact from '../abis/Splice.json';

export const getInstance = (signer: ethers.Signer): ethers.Contract => {
  return new ethers.Contract(
    process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string,
    spliceArtefact.abi,
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
