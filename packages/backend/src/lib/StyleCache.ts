import { ipfsGW, Splice } from '@splicenft/common';
import { SpliceInstances } from './SpliceContracts';

import axios from 'axios';

type TStyleMetadata = {
  properties: {
    code: string;
  };
};
export class StyleData {
  private tokenId;
  private metadata: TStyleMetadata;
  private code: string | null;
  private preview: string | null;

  constructor(tokenId: number, metadata: TStyleMetadata) {
    this.tokenId = tokenId;
    this.metadata = metadata;
    this.code = null;
    this.preview = null;
  }

  getMetadata() {
    return this.metadata;
  }
  async getCode() {
    if (this.code) return this.code;

    const codeUrl = this.metadata.properties.code;
    const gwUrl = ipfsGW(codeUrl);
    this.code = await axios.get(gwUrl);
    return this.code;
  }
}

export class StyleMetadataCache {
  private splice: Splice;
  private styles: Promise<StyleData[]> | null;
  private fetched: boolean | null;

  constructor(splice: Splice) {
    this.splice = splice;
    this.styles = null;
    this.fetched = null;
  }

  async fetchAllStyles() {
    if (this.fetched !== null) return;

    console.debug('start fetchgin md');

    const allStyles = await this.splice.getAllStyles();

    console.log(allStyles);

    // const promises = allStyles.map((tokenMetadataResponse) => {
    //   const { tokenId, metadataUrl } = tokenMetadataResponse;
    //   return (async () => {
    //     const gwUrl = ipfsGW(metadataUrl);
    //     const metadata = await (await axios.get<TStyleMetadata>(gwUrl)).data;
    //     return new StyleData(tokenId, metadata);
    //   })();
    // });

    // this.styles = Promise.all(promises);
    // this.styles.then((res) => {
    //   console.log('fetched %s style metadata for network %s', res.length);
    // });
  }
}

export class StyleCache {
  private supportedNetworks: number[];
  private networks: Record<number, StyleMetadataCache>;

  constructor(supportedNetworks: number[]) {
    this.supportedNetworks = supportedNetworks;
    this.networks = {};
  }

  init() {
    for (const nw of this.supportedNetworks) {
      const splice = SpliceInstances[nw];
      if (splice) {
        const mdCache = new StyleMetadataCache(splice);
        mdCache.fetchAllStyles();
        this.networks[nw] = mdCache;
      }
    }
  }
}
