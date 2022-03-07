import axios from 'axios';
import { ipfsGW } from './img';
import { Renderer } from './types/Renderers';
import { StyleNFT } from './types/SpliceNFT';

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

  getMetadata(): StyleNFT {
    return this.metadata;
  }

  getMetadataUrl() {
    return this.metadataUrl;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async getRenderer(): Promise<Renderer> {
    if (this.renderer) return this.renderer;
    const code = await this.getCode();
    const renderer = Function(`"use strict";return (${code})`)();
    this.renderer = renderer;
    return renderer;
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
