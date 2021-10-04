import { utils, BigNumber, Contract } from 'ethers';

export class Splice {
  private contract: Contract;

  constructor(splice: Contract) {
    this.contract = splice;
  }

  public async startMinting() {
    // create image
    // create image cid
    // create metadata with image cid
    // create metadata cid
    // create minting request job
  }

  public static computeRandomnessLocally(
    collection: string,
    token_id: number
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

  // public computeRandomnessOnChain(
  //   collection: string,
  //   token_id: number
  // ): number {}

  public async getJob(jobId: number) {}
}
