import {
  ISplicePriceStrategy,
  ISplicePriceStrategy__factory,
  ReplaceablePaymentSplitter,
  ReplaceablePaymentSplitter__factory,
  SpliceStyleNFT as StyleNFTContract
} from '@splicenft/contracts';
import axios from 'axios';
import { BigNumber, ethers } from 'ethers';
import { ipfsGW } from './img';
import { StyleNFT } from './types/SpliceNFT';
import { Partnership, StyleStats } from './types/Styles';
import { Renderer } from './types/Renderers';

export class Style {
  protected _tokenId: number;
  protected metadataUrl: string;
  protected metadata: StyleNFT;
  protected code: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  protected renderer: Renderer | null;

  public get tokenId() {
    return this._tokenId;
  }

  constructor(tokenId: number, metadataUrl: string, metadata: StyleNFT) {
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
    return ethers.constants.AddressZero;
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
    return false;
  }

  async toggleActive(newVal: boolean): Promise<unknown> {
    return;
  }

  async ownerOf(): Promise<string> {
    return ethers.constants.AddressZero;
  }

  async isMintable(
    collections: string[],
    tokenIds: ethers.BigNumberish[],
    minter: string
  ): Promise<boolean | string> {
    return false;
  }

  async partnership(): Promise<Partnership | undefined> {
    return undefined;
  }
  async stats(): Promise<StyleStats> {
    throw 'unmanaged style';
  }

  async paymentSplitter(): Promise<ReplaceablePaymentSplitter> {
    throw 'unmanaged style';
  }

  async priceStrategy(): Promise<ISplicePriceStrategy> {
    throw 'unmanaged style';
  }

  async quote(
    collection: string,
    tokenId: ethers.BigNumberish
  ): Promise<BigNumber> {
    throw 'unmanaged style';
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
    const gwUrl = ipfsGW(this.metadata.code);
    console.debug(`fetching code for ${this.tokenId} at ${gwUrl}`);

    const code = await (await axios.get(gwUrl)).data;
    console.debug(`code for ${this.tokenId} fetched`);
    this.code = code;
    return code;
  }
}

export class ActiveStyle extends Style {
  private contract: StyleNFTContract;

  constructor(
    contract: StyleNFTContract,
    tokenId: number,
    metadataUrl: string,
    metadata: StyleNFT
  ) {
    super(tokenId, metadataUrl, metadata);
    this.contract = contract;
  }

  getCollectionAddress() {
    return this.contract.address;
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
      if (!e.data?.message) return e.message;

      const xRegx = /^.*'(.*)'$/gi;
      const res = xRegx.exec(e.data.message);
      return res ? res[1] : 'Unknown error occurred during isMintable query';
    }
  }

  async partnership(): Promise<Partnership | undefined> {
    const partnership = await this.contract.getPartnership(this.tokenId);
    if (partnership.collections.length === 0) return undefined;

    return {
      collections: partnership.collections,
      exclusive: partnership.exclusive,
      until: new Date(partnership.until.toNumber())
    };
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

  async paymentSplitter(): Promise<ReplaceablePaymentSplitter> {
    const settings = await this.contract.getSettings(this.tokenId);
    return ReplaceablePaymentSplitter__factory.connect(
      settings.paymentSplitter,
      this.contract.provider
    );
  }

  async priceStrategy(): Promise<ISplicePriceStrategy> {
    const settings = await this.contract.getSettings(this.tokenId);
    return ISplicePriceStrategy__factory.connect(
      settings.priceStrategy,
      this.contract.provider
    );
  }

  async quote(
    collection: string,
    tokenId: ethers.BigNumberish
  ): Promise<BigNumber> {
    return this.contract.quoteFee(this.tokenId, [collection], [tokenId]);
  }
}
