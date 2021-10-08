import {
  utils,
  BigNumber,
  Contract,
  Signer,
  constants,
  ethers,
  providers
} from 'ethers';
import { abi as SpliceABI } from './abi/Splice.json';
import {
  MintRequestedEvent,
  Splice as SpliceContract
} from '@splicenft/contracts';
import { CID } from 'multiformats/cid';

export enum MintingState {
  UNKNOWN,
  NOT_MINTED,
  GENERATING,
  GENERATED,
  SAVED,
  SAVED_IPFS,
  MINTING_REQUESTED,
  MINTING,
  MINTED
}

export enum MintJobStatus {
  REQUESTED,
  DONE
}

export type MintJob = {
  requestor: string;
  collection: string;
  metadataCID: string;
  randomness: number;
  recipient: string;
  token_id: BigNumber;
  status: MintJobStatus;
};

export class Splice {
  private contract: SpliceContract;

  constructor(splice: SpliceContract) {
    this.contract = splice;
  }

  static from(address: string, signer: Signer | providers.Provider) {
    const contract = new Contract(address, SpliceABI, signer) as SpliceContract;
    return new Splice(contract);
  }

  public async startMinting(
    collectionAddress: string,
    tokenId: string | number,
    cidString: string,
    recipient: string
  ): Promise<number> {
    //console.log('orig', cidString);

    const tx = await this.contract.requestMint(
      collectionAddress,
      tokenId,
      cidString,
      recipient
    );

    const result = await tx.wait();
    const requestedEvent: MintRequestedEvent =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result.events![0] as MintRequestedEvent;
    const jobId = requestedEvent.args.jobIndex;
    return jobId.toNumber();
    // create metadata with image cid
    // create metadata cid
    // create minting request job

    // const receipt = await this.contract.requestMint(
    //   originNftAddress,
    //   recipient
    // );
    //console.log(receipt);
  }

  public static computeRandomnessLocally(
    collection: string,
    token_id: string | number
  ): number {
    //todo: check behaviour between this and solidity (js max int)
    //keccak256(abi.encodePacked(address(nft), token_id));
    const bnToken = BigNumber.from(token_id);
    const hxToken = utils.hexZeroPad(bnToken.toHexString(), 32);
    const inp = `${collection}${hxToken.slice(2)}`;
    const kecc = utils.keccak256(inp);
    const bytes = utils.arrayify(kecc);
    const _randomness = new DataView(bytes.buffer).getUint32(0);
    return _randomness;
  }

  public async computeRandomnessOnChain(
    collection: string,
    token_id: number | string
  ): Promise<number> {
    return await this.contract.randomness(collection, token_id);
  }
  // public computeRandomnessOnChain(
  //   collection: string,
  //   token_id: number
  // ): number {}

  public async findJobFor(
    collectionAddress: string,
    tokenId: string | number
  ): Promise<{ jobId: number; job: MintJob } | null> {
    const { jobId, job } = await this.contract.findMintJob(
      collectionAddress,
      tokenId
    );
    if (job.collection === constants.AddressZero) {
      return null;
    }
    return { jobId: jobId.toNumber(), job };
  }
  public async getMintJob(jobId: number): Promise<MintJob | null> {
    const mintJob = await this.contract.getMintJob(jobId);
    if (mintJob.collection === constants.AddressZero) {
      return null;
    }
    return mintJob;
  }
}
