import {
  Splice__factory as SpliceFactory,
  SpliceStyleNFTV1__factory as StyleNFTFactory,
  Splice as SpliceContract,
  SpliceStyleNFTV1 as StyleNFTContract
} from '@splicenft/contracts';
import { TransferEvent } from '@splicenft/contracts/typechain/Splice';
import axios from 'axios';
import { BigNumber, Contract, ethers, providers, Signer, utils } from 'ethers';
import { ipfsGW } from './img';
import { SpliceNFT } from './types/SpliceNFT';

export const SPLICE_ADDRESSES: Record<number, string> = {
  4: '0x729410F8db69932E38dF158101e60d09aAA6423D'
  //42: '0x231e5BA16e2C9BE8918cf67d477052f3F6C35036'
  //1: '0x0'
};

export enum MintingState {
  UNKNOWN,
  GENERATED,
  VALIDATED,
  MINTED,
  FAILED
}

export type TokenHeritage = {
  requestor: string;
  origin_collection: string;
  origin_token_id: BigNumber;
  style_token_id: BigNumber;
  splice_token_id: BigNumber;
};

type TokenMetadataResponse = Array<{ tokenId: string; metadataUrl: string }>;

export class Splice {
  private contract: SpliceContract;

  private styleNFTContract?: StyleNFTContract;

  get address() {
    return this.contract.address;
  }

  constructor(splice: SpliceContract) {
    this.contract = splice;
  }

  get providerOrSigner(): { provider: providers.Provider; signer: Signer } {
    return {
      provider: this.contract.provider,
      signer: this.contract.signer
    };
  }
  static from(address: string, signer: Signer | providers.Provider) {
    const spliceFactory = SpliceFactory.connect(address, signer);
    const contract = spliceFactory.attach(address);
    const spl = new Splice(contract);
    return spl;
  }

  public async getStyleNFT(): Promise<StyleNFTContract> {
    if (this.styleNFTContract) return this.styleNFTContract;

    const styleNFTAddress = await this.contract.getStyleNFT();

    this.styleNFTContract = StyleNFTFactory.connect(
      styleNFTAddress,
      this.contract.signer || this.contract.provider
    );
    return this.styleNFTContract;
  }

  public async getChain(): Promise<number> {
    const network = await this.contract.provider.getNetwork();
    return network.chainId;
  }
  public async quote(
    collection: string,
    styleTokenId: string
  ): Promise<BigNumber> {
    const quoteWei = await this.contract.quote(collection, styleTokenId);
    return quoteWei;
  }

  public async mint({
    origin_collection,
    origin_token_id,
    style_token_id,
    recipient,
    mintingFee
  }: {
    origin_collection: string;
    origin_token_id: string | number;
    style_token_id: string | number;
    recipient: string;
    mintingFee: ethers.BigNumber;
  }): Promise<{ transactionHash: string; spliceTokenId: number | undefined }> {
    const tx = await this.contract.mint(
      origin_collection,
      origin_token_id,
      style_token_id,
      recipient,
      {
        value: mintingFee
      }
    );
    const result = await tx.wait();
    console.log(result);

    const transferEvent: TransferEvent =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result.events?.find((evt) => evt.event === 'Transfer') as TransferEvent;

    return {
      transactionHash: result.transactionHash,
      spliceTokenId: transferEvent?.args.tokenId.toNumber()
    };
  }

  //todo: allow tokenId to be BigNumber
  public static computeRandomness(
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

  public async findHeritage(
    collectionAddress: string,
    tokenId: string | number
  ): Promise<TokenHeritage | null> {
    const heritageResult = await this.contract.findHeritage(
      collectionAddress,
      tokenId
    );
    if (heritageResult.splice_token_id.isZero()) return null;
    return {
      ...heritageResult.heritage,
      splice_token_id: heritageResult.splice_token_id
    };
  }

  public async getHeritage(tokenId: number): Promise<TokenHeritage | null> {
    const result = await this.contract.tokenHeritage(tokenId);

    if (
      result.origin_token_id.isZero() ||
      result.origin_collection === ethers.constants.AddressZero
    ) {
      return null;
    } else
      return {
        ...result,
        splice_token_id: BigNumber.from(tokenId)
      };
  }

  public async getMetadataUrl(tokenId: number | string): Promise<string> {
    return await this.contract.tokenURI(tokenId);
  }
  public async fetchMetadata(heritage: TokenHeritage): Promise<SpliceNFT> {
    const _metadataUrl = await this.getMetadataUrl(
      heritage.splice_token_id.toString()
    );

    const url = ipfsGW(_metadataUrl);
    const _metadata = await axios.get(url);
    const metadata = (await _metadata.data) as SpliceNFT;
    metadata.external_url = _metadataUrl;
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
          return { tokenId: tokenId.toString(), metadataUrl };
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

          return { tokenId: tokenId.toString(), metadataUrl };
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
