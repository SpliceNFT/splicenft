import { ethers } from 'ethers';
import spliceArtefact from '../abis/Splice.json';

export enum MintingState {
  UNKNOWN,
  NOT_MINTED,
  GENERATING,
  GENERATED,
  SAVED,
  MINTING_REQUESTED,
  MINTING,
  MINTED
}

export interface ISplice {
  startMinting: (
    originNftAddress: string,
    recipient: string
  ) => Promise<number>;
}

export default function Splice(signer: ethers.Signer): ISplice {
  const contract = new ethers.Contract(
    process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string,
    spliceArtefact.abi,
    signer
  );

  return {
    startMinting: async (
      originNftAddress: string,
      recipient: string
    ): Promise<number> => {
      const receipt = await contract.requestMint(originNftAddress, recipient);
      console.log(receipt);
      return 42;
    }
  };
}
