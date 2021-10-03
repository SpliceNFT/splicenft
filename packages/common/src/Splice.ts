import ethers from 'ethers';

export class Splice {
  private contract: ethers.Contract;

  constructor(splice: ethers.Contract) {
    this.contract = splice;
  }

  public async startMinting() {
    // create image
    // create image cid
    // create metadata with image cid
    // create metadata cid
    // create minting request job
  }

  public async getJob(jobId: number) {}
}
