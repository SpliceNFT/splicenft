import { SpliceStyleNFT as StyleNFTContract } from '@splicenft/contracts';
import axios from 'axios';
import { BigNumber } from 'ethers';
import { ipfsGW } from './img';
import { Renderer } from './types/Renderers';
import { StyleNFT } from './types/SpliceNFT';

export class Style {
  private contract: StyleNFTContract;
  private _tokenId: number;
  private metadataUrl: string;
  private metadata: StyleNFT;
  private code: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  private renderer: Renderer | null;

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
    return this.contract.address;
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

  async quote(collection: string): Promise<BigNumber> {
    return this.contract.quoteFee(collection, this.tokenId);
  }

  async getCodeFromBackend(
    baseUrl: string,
    networkId: string | number
  ): Promise<string> {
    if (this.code) return this.code;
    const url = `${baseUrl}/styles/${networkId}/${this._tokenId}`;
    console.debug(
      `[%s] fetching code for [%s] from backend`,
      networkId,
      this.tokenId
    );
    const styleMetadata = await (await axios.get(url)).data;
    //todo consider cancelling an ongoing IPFS request https://github.com/axios/axios#cancellation
    console.debug(`[%s] code for [%s] fetched`, networkId, this.tokenId);
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
