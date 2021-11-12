import {
  Splice as SpliceContract,
  SpliceStyleNFTV1 as StyleNFTContract,
  SpliceStyleNFTV1__factory as StyleNFTFactory,
  Splice__factory as SpliceFactory
} from '@splicenft/contracts';
import { TransferEvent } from '@splicenft/contracts/typechain/Splice';
import axios from 'axios';
import { BigNumber, ethers, providers, Signer, utils } from 'ethers';
import { erc721 } from '.';
import { ipfsGW } from './img';
import { SpliceNFT } from './types/SpliceNFT';

export const SPLICE_ADDRESSES: Record<number, string> = {
  4: '0x729410F8db69932E38dF158101e60d09aAA6423D'
  //42: '0x231e5BA16e2C9BE8918cf67d477052f3F6C35036'
  //1: '0x0'
};

export enum MintingState {
  UNKNOWN,
  UNMINTED,
  GENERATED,
  MINTED,
  FAILED
}

export type TokenProvenance = {
  origin_collection: string;
  origin_token_id: BigNumber;
  splice_token_id: BigNumber;
  //these are contianed in splice_token_id
  //see tokenIdToStyleAndToken
  style_token_id: number;
  style_token_token_id: number;
};

export type TokenMetadataResponse = { tokenId: string; metadataUrl: string };

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

    const styleNFTAddress = await this.contract.styleNFT();

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

  public async ownerOf(tokenId: BigNumber | string): Promise<string> {
    return this.contract.ownerOf(tokenId);
  }

  public static tokenIdToStyleAndToken(tokenId: BigNumber): {
    style_token_id: number;
    token_id: number;
  } {
    const hxToken = utils.arrayify(utils.zeroPad(tokenId.toHexString(), 8));
    return {
      style_token_id: BigNumber.from(hxToken.slice(0, 4)).toNumber(),
      token_id: BigNumber.from(hxToken.slice(4)).toNumber()
    };
  }

  /**
   * same as in solidity
   */
  public static originHash(
    collectionAddress: string,
    originTokenId: string
  ): string {
    const bnToken = BigNumber.from(originTokenId);
    const hxToken = utils.hexZeroPad(bnToken.toHexString(), 32);
    const inp = `${collectionAddress}${hxToken.slice(2)}`;
    return utils.keccak256(inp);
  }

  //todo: allow tokenId to be BigNumber
  public static computeRandomness(
    collectionAddress: string,
    originTokenId: string
  ): number {
    //todo: check behaviour between this and solidity (js max int)
    //keccak256(abi.encodePacked(address(nft), token_id));

    const bytes = utils.arrayify(
      Splice.originHash(collectionAddress, originTokenId)
    );
    const _randomness = new DataView(bytes.buffer).getUint32(0);
    return _randomness;
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
    additionalData,
    mintingFee
  }: {
    origin_collection: string;
    origin_token_id: string | BigNumber;
    style_token_id: string | number;
    additionalData?: Uint8Array;
    mintingFee: ethers.BigNumber;
  }): Promise<{ transactionHash: string; spliceTokenId: number }> {
    const inputParams = ethers.utils.hexlify(additionalData || []);
    const tx = await this.contract.mint(
      origin_collection,
      origin_token_id,
      style_token_id,
      inputParams,
      {
        value: mintingFee
      }
    );
    const result = await tx.wait();

    const transferEvent: TransferEvent =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result.events?.find((evt) => evt.event === 'Transfer') as TransferEvent;
    if (!transferEvent) {
      throw new Error('no Transfer event captured in minting transaction');
    }
    return {
      transactionHash: result.transactionHash,
      spliceTokenId: transferEvent.args.tokenId.toNumber()
    };
  }

  /**
   * @description find all splices for an origin
   */
  public async findProvenances(
    collectionAddress: string,
    tokenId: string
  ): Promise<TokenProvenance[] | null> {
    const originHash = Splice.originHash(collectionAddress, tokenId);
    const spliceCount = (
      await this.contract.spliceCountForOrigin(originHash)
    ).toNumber();
    const ret: TokenProvenance[] = [];

    if (spliceCount === 0) return [];
    for (let i = 0; i < spliceCount; i++) {
      const spliceTokenId = await this.contract.originToTokenId(originHash, i);
      const { style_token_id, token_id: style_token_token_id } =
        Splice.tokenIdToStyleAndToken(spliceTokenId);
      ret.push({
        origin_collection: collectionAddress,
        origin_token_id: ethers.BigNumber.from(tokenId),
        splice_token_id: spliceTokenId,
        style_token_id,
        style_token_token_id
      });
    }
    return ret;
  }

  public async getProvenance(
    spliceTokenId: string | BigNumber
  ): Promise<TokenProvenance | null> {
    const bnTokenId: BigNumber =
      'string' === typeof spliceTokenId
        ? BigNumber.from(spliceTokenId)
        : spliceTokenId;

    const { style_token_id, token_id: style_token_token_id } =
      Splice.tokenIdToStyleAndToken(bnTokenId);

    const provenance = await this.contract.tokenProvenance(spliceTokenId);
    if (
      provenance.origin_token_id.isZero() ||
      provenance.origin_collection === ethers.constants.AddressZero
    ) {
      return null;
    }

    return {
      origin_collection: provenance.origin_collection,
      origin_token_id: provenance.origin_token_id,
      splice_token_id: bnTokenId,
      style_token_id,
      style_token_token_id
    };
  }

  public getOriginNftContract(address: string) {
    return erc721(
      this.providerOrSigner.signer || this.providerOrSigner.provider,
      address
    );
  }

  public async getMetadataUrl(
    tokenId: BigNumber | number | string
  ): Promise<string> {
    return await this.contract.tokenURI(tokenId);
  }

  public async getMetadata(provenance: TokenProvenance): Promise<SpliceNFT> {
    const _metadataUrl = await this.getMetadataUrl(provenance.splice_token_id);
    return this.fetchMetadata(_metadataUrl);
  }

  /**
   * adds the metadata url to the metadata result
   */
  public async fetchMetadata(metadataUrl: string): Promise<SpliceNFT> {
    const metadata = (await (
      await axios.get(ipfsGW(metadataUrl))
    ).data) as SpliceNFT;
    metadata.splice.metadataUrl = metadataUrl;
    return metadata;
  }

  //todo: this might become highly expensive
  //needs a subgraph!
  public async getAllStyles(): Promise<TokenMetadataResponse[]> {
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

  /**
   * @description gets all splices an user owns.
   * @todo: this also could be provided by an API or NFTPort
   */
  public async getAllSplices(
    address: string,
    splicesPerPage = 20
  ): Promise<TokenMetadataResponse[]> {
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
