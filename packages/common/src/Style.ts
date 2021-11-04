import axios from 'axios';
import { ipfsGW } from './img';
import { Renderer } from './types/Renderers';
import { StyleNFT } from './types/SpliceNFT';

export class Style {
  private _collectionAddress: string;
  private _tokenId: string;
  private metadataUrl: string;
  private metadata: StyleNFT;
  private code: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  private renderer: Renderer | null;

  public get tokenId() {
    return this._tokenId;
  }

  constructor(
    collectionAddress: string,
    tokenId: string,
    metadataUrl: string,
    metadata: StyleNFT
  ) {
    this._collectionAddress = collectionAddress;
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
    return this._collectionAddress;
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  async getRenderer(): Promise<Renderer> {
    if (this.renderer) return this.renderer;
    const code = await this.getCode();
    const renderer = Function(`"use strict";return (${code})`)();
    this.renderer = renderer;
    return renderer;
  }

  async getCachedCode(
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

    const codeUrl = this.metadata.properties.code;
    const gwUrl = ipfsGW(codeUrl);
    console.debug(`fetching code for ${this.tokenId} at ${gwUrl}`);
    try {
      const code = await (await axios.get(gwUrl)).data;
      console.debug(`code for ${this.tokenId} fetched`);
      this.code = code;
      return code;
    } catch (err: any) {
      console.error('failed fetching code', err);
    }

    return '';
  }
}
