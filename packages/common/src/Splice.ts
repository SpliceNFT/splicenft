import {
  Splice as SpliceContract,
  SpliceStyleNFT as StyleNFTContract,
  SpliceFactory,
  StyleNFTFactory
} from '@splicenft/contracts';
import axios from 'axios';
import { BigNumber, Contract, providers, Signer, utils } from 'ethers';
import { ipfsGW, NFTMetaData } from '.';

export const SPLICE_ADDRESSES: Record<number, string> = {
  //4: '0x0',
  42: '0x231e5BA16e2C9BE8918cf67d477052f3F6C35036'
  //1: '0x0'
};

export enum MintingState {
  UNKNOWN,
  GENERATED,
  PERSISTED,
  MINTED,
  FAILED
}

export type TokenHeritage = {
  requestor: string;
  origin_collection: string;
  origin_token_id: BigNumber;
  style_token_id: BigNumber;
  splice_token_id: BigNumber;
  metadataCID: string;
};

type TokenMetadataResponse = Array<{ tokenId: number; metadataUrl: string }>;

export class Splice {
  private contract: SpliceContract.Splice;

  private styleNFTContract?: StyleNFTContract.SpliceStyleNFTV1;

  get address() {
    return this.contract.address;
  }

  constructor(splice: SpliceContract.Splice) {
    this.contract = splice;
  }

  static from(address: string, signer: Signer | providers.Provider) {
    const spliceFactory = SpliceFactory.connect(address, signer);
    const contract = spliceFactory.attach(address);
    const spl = new Splice(contract);
    return spl;
  }

  public async getStyleNFT(): Promise<StyleNFTContract.SpliceStyleNFTV1> {
    if (this.styleNFTContract) return this.styleNFTContract;

    const styleNFTAddress = await this.contract.getStyleNFT();

    this.styleNFTContract = StyleNFTFactory.connect(
      styleNFTAddress,
      this.contract.signer || this.contract.provider
    );
    return this.styleNFTContract;
  }

  public async isCollectionAllowed(
    collectionAddress: string
  ): Promise<boolean> {
    return this.contract.isCollectionAllowed(collectionAddress);
  }

  // public async requestMinting(
  //   collectionAddress: string,
  //   tokenId: string | number,
  //   cidString: string,
  //   recipient: string
  // ): Promise<number> {
  //   //console.log('orig', cidString);

  //   const tx = await this.contract.requestMint(
  //     collectionAddress,
  //     tokenId,
  //     cidString,
  //     recipient
  //   );

  //   const result = await tx.wait();
  //   const requestedEvent: MintRequestedEvent =
  //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //     result.events![0] as MintRequestedEvent;
  //   const jobId = requestedEvent.args.jobId;
  //   return jobId;

  //   //console.log(receipt);
  // }

  public async quote(
    collection: string,
    styleTokenId: number
  ): Promise<BigNumber> {
    const quoteWei = await this.contract.quote(collection, styleTokenId);
    return quoteWei;
  }

  public async mint({
    origin_collection,
    origin_token_id,
    style_token_id,
    metadataCID,
    your_signature,
    verifier_signature,
    recipient
  }: {
    origin_collection: string;
    origin_token_id: string | number;
    style_token_id: string | number;
    metadataCID: string;
    your_signature: string | Uint8Array;
    verifier_signature: string | Uint8Array;
    recipient: string;
  }) {
    const tx = await this.contract.mint(
      origin_collection,
      origin_token_id,
      style_token_id,
      metadataCID,
      your_signature,
      verifier_signature,
      recipient
    );
    const result = await tx.wait();
    const transferEvent: SpliceContract.TransferEvent =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result.events![0] as SpliceContract.TransferEvent;
    const tokenId = transferEvent.args.tokenId;
    return tokenId.toNumber();
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

  public async findHeritage(
    collectionAddress: string,
    tokenId: string | number
  ): Promise<TokenHeritage | null> {
    const heritageResult = await this.contract.findHeritage(
      collectionAddress,
      tokenId
    );
    return {
      ...heritageResult.heritage,
      splice_token_id: heritageResult.splice_token_id
    };
  }

  public async getHeritage(tokenId: number): Promise<TokenHeritage | null> {
    const result = await this.contract.tokenHeritage(tokenId);
    return {
      ...result,
      splice_token_id: BigNumber.from(tokenId)
    };
  }

  public getMetadataUrl(heritage: TokenHeritage) {
    return `ipfs://${heritage.metadataCID}/metadata.json`;
  }

  public async fetchMetadata(heritage: TokenHeritage): Promise<NFTMetaData> {
    //todo: get directly from ipfs
    const url = ipfsGW(this.getMetadataUrl(heritage));
    const _metadata = await axios.get(url);
    const metadata = (await _metadata.data) as NFTMetaData;
    return metadata;
  }

  //todo: this might get highly expensive
  //needs a subgraph!
  public async getAllStyles(): Promise<TokenMetadataResponse> {
    const styleNFT = await this.getStyleNFT();
    const totalSupply = await styleNFT.totalSupply();

    const promises = [];

    for (let i = 0; i < Math.min(10, totalSupply.toNumber()); i++) {
      promises.push(
        (async () => {
          const tokenId = await styleNFT.tokenByIndex(i);
          const metadataUrl = await styleNFT.tokenURI(tokenId);
          return { tokenId: tokenId.toNumber(), metadataUrl };
        })()
      );
    }
    return Promise.all(promises);
  }

  //todo: this also could be provided by an API or NFTPort
  public async getAllSplices(
    address: string,
    splicesPerPage = 20
  ): Promise<TokenMetadataResponse> {
    const balance = await this.contract.balanceOf(address);

    if (balance.isZero()) return [];
    const promises = [];
    for (let i = 0; i < Math.min(splicesPerPage, balance.toNumber()); i++) {
      promises.push(
        (async () => {
          const tokenId = await this.contract.tokenOfOwnerByIndex(
            address,
            BigNumber.from(i)
          );
          const metadataUrl = await this.contract.tokenURI(tokenId);

          return { tokenId: tokenId.toNumber(), metadataUrl };
        })()
      );
    }
    const tokens = await Promise.all(promises);
    return tokens;
  }

  public async listenForMintResult() {
    this.contract.on(this.contract.filters.Transfer(), (jobResult) => {
      console.log(jobResult);
    });
  }
}
