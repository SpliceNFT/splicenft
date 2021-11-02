import { ipfsGW, Splice, Style, StyleNFT } from '@splicenft/common';
import { SpliceInstances } from './SpliceContracts';

import axios from 'axios';

export class StyleMetadataCache {
  private splice: Splice;
  private styles: Style[];
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
        const styleData = new Style(
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
        mdCache.fetchAllStyles().catch((e: any) => {
          console.error('cant setup cache on network', networkId, e.message);
        });
        this.caches[networkId] = mdCache;
      }
    }
  }
}
