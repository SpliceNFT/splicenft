import { SpliceStyleNFT as StyleNFTContract } from '@splicenft/contracts';
import axios from 'axios';
import { BigNumber, ethers } from 'ethers';
import { ipfsGW } from './img';
import { Renderer } from './types/Renderers';
import { StyleNFT } from './types/SpliceNFT';

export type StyleStats = {
  settings: {
    mintedOfStyle: number;
    cap: number;
    priceStrategy: string;
    salesIsActive: boolean;
    isFrozen: boolean;
    styleCID: string;
    maxInputs: number;
    paymentSplitter: string;
  };
  owner: string;
  active: boolean;
  reserved: number;
};

export class Style {
  private contract: StyleNFTContract;
  protected _tokenId: number;
  protected metadataUrl: string;
  protected metadata: StyleNFT;
  protected code: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  protected renderer: Renderer | null;

  public get tokenId() {
    return this._tokenId;
  }

  constructor(
    contract: StyleNFTContract,
    tokenId: number,
    metadataUrl: string,
    metadata: StyleNFT
  ) {
    this.contract = contract;
    this._tokenId = tokenId;
    this.metadata = metadata;
    this.metadataUrl = metadataUrl;
    this.code = null;
    this.renderer = null;
  }

  getMetadata() {
    return this.metadata;
  }

  getMetadataUrl() {
    return this.metadataUrl;
  }

  getCollectionAddress() {
    return this.contract ? this.contract.address : ethers.constants.AddressZero;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async getRenderer(): Promise<Renderer> {
    if (this.renderer) return this.renderer;
    const code = await this.getCode();
    const renderer = Function(`"use strict";return (${code})`)();
    this.renderer = renderer;
    return renderer;
  }

  async isActive(): Promise<boolean> {
    return this.contract.isSaleActive(this.tokenId);
  }

  async toggleActive(newVal: boolean): Promise<unknown> {
    return this.contract.toggleSaleIsActive(this.tokenId, newVal);
  }

  async ownerOf(): Promise<string> {
    return this.contract.ownerOf(this.tokenId);
  }

  async isMintable(
    collections: string[],
    tokenIds: ethers.BigNumberish[],
    minter: string
  ): Promise<boolean | string> {
    try {
      const result = await this.contract.isMintable(
        this.tokenId,
        collections,
        tokenIds,
        minter
      );
      return result;
    } catch (e: any) {
      console.log(e);
      if (!e.data?.message) return e.message;

      const xRegx = /^.*'(.*)'$/gi;
      const res = xRegx.exec(e.data.message);
      console.log(res);
      return res ? res[1] : 'foo';
    }
  }

  async stats(): Promise<StyleStats> {
    const settings = await this.contract.getSettings(this.tokenId);
    const active = await this.contract.isSaleActive(this.tokenId);
    const owner = await this.contract.ownerOf(this.tokenId);
    const reserved = await this.contract.reservedTokens(this.tokenId);

    return {
      settings,
      active,
      owner,
      reserved
    };
  }

  async quote(
    collection: string,
    tokenId: ethers.BigNumberish
  ): Promise<BigNumber> {
    return this.contract.quoteFee(this.tokenId, [collection], [tokenId]);
  }

  async getCodeFromBackend(
    baseUrl: string,
    networkId: string | number
  ): Promise<string> {
    if (this.code) return this.code;
    const url = `${baseUrl}/styles/${networkId}/${this._tokenId}`;

    const styleMetadata = await (await axios.get(url)).data;
    //todo consider cancelling an ongoing IPFS request https://github.com/axios/axios#cancellation
    this.code = styleMetadata.code;
    return styleMetadata.code;
  }

  async getCode(): Promise<string> {
    if (this.code) return this.code;
    //todo: deprecated
    const codeLocation = this.metadata.code || this.metadata.properties.code;
    const gwUrl = ipfsGW(codeLocation);
    console.debug(`fetching code for ${this.tokenId} at ${gwUrl}`);

    const code = await (await axios.get(gwUrl)).data;
    console.debug(`code for ${this.tokenId} fetched`);
    this.code = code;
    return code;
  }
}
