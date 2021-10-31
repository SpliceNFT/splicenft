import { ipfsGW, Renderer, Splice, StyleNFT } from '@splicenft/common';
import { SpliceInstances } from './SpliceContracts';

import axios from 'axios';

export class StyleData {
  private _collectionAddress: string;
  private _tokenId;
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
    tokenId: number,
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

  async getCode(): Promise<string> {
    if (this.code) return this.code;

    const codeUrl = this.metadata.properties.code;
    const gwUrl = ipfsGW(codeUrl);
    console.log(`fetching code for ${this.tokenId} at ${gwUrl}`);
    try {
      const code = await (await axios.get(gwUrl)).data;
      console.log(`code for ${this.tokenId} fetched`);
      this.code = code;
      return code;
    } catch (err: any) {
      console.error('failed fetching code', err);
    }

    return '';
  }
}

export class StyleMetadataCache {
  private splice: Splice;
  private styles: StyleData[];
  private fetched: boolean | null;
  private networkId: number;

  constructor(networkId: number, splice: Splice) {
    this.networkId = networkId;
    this.splice = splice;
    this.styles = [];
    this.fetched = null;
  }

  public getStyles() {
    return this.styles;
  }

  public getStyle(tokenId: number) {
    return this.styles.find((s) => s.tokenId === tokenId);
  }

  async fetchAllStyles() {
    if (this.fetched !== null) return;

    console.debug('start fetching metadata for network %s', this.networkId);

    const allStyles = await this.splice.getAllStyles();
    const styleCollection = await this.splice.getStyleNFT();

    const promises = allStyles.map((tokenMetadataResponse) => {
      const { tokenId, metadataUrl } = tokenMetadataResponse;
      return (async () => {
        const gwUrl = ipfsGW(metadataUrl);
        console.debug(`start fetching metadata at ${gwUrl}`);

        const metadata = await (await axios.get<StyleNFT>(gwUrl)).data;
        const styleData = new StyleData(
          styleCollection.address,
          tokenId,
          metadataUrl,
          metadata
        );
        styleData.getCode();
        return styleData;
      })();
    });

    const resv = Promise.all(promises);
    resv.then((styles) => {
      console.debug('metadata ready for network %s', this.networkId);
      this.styles = styles;
      styles.map((styleData) => {
        const { name, properties } = styleData.getMetadata();
        console.log(
          '%d: %s by %s ',
          styleData.tokenId,
          name,
          properties.creator_name
        );
      });
    });
  }
}

export class StyleCache {
  private supportedNetworks: number[];
  private caches: Record<number, StyleMetadataCache>;

  constructor(supportedNetworks: number[]) {
    this.supportedNetworks = supportedNetworks;
    this.caches = {};
  }

  public getCache(networkId: number): StyleMetadataCache | null {
    return this.caches[networkId];
  }

  init() {
    for (const networkId of this.supportedNetworks) {
      const splice = SpliceInstances[networkId];
      if (splice) {
        const mdCache = new StyleMetadataCache(networkId, splice);
        mdCache.fetchAllStyles();
        this.caches[networkId] = mdCache;
      }
    }
  }
}
