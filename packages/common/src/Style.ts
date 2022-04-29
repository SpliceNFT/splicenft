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
  protected code_url: string;

  public get tokenId() {
    return this._tokenId;
  }

  constructor(
    tokenId: number,
    metadataUrl: string,
    metadata: StyleNFT,
    code_url: string
  ) {
    this._tokenId = tokenId;
    this.metadata = metadata;
    this.metadataUrl = metadataUrl;
    this.code_url = code_url;
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

  async getCodeFromBackend(baseUrl: string): Promise<string> {
    if (this.code) return this.code;
    const url = `${baseUrl}${this.code_url}`;

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

  setCode(code: string) {
    this.code = code;
  }
}
