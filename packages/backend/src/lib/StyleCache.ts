import { ipfsGW, Style, StyleNFT } from '@splicenft/common';
import axios from 'axios';
import { getSplice } from './SpliceContracts';
import * as Cache from './Cache';

export class StyleMetadataCache {
  private styles: Style[];
  private fetched: boolean | null;
  private networkId: number;

  constructor(networkId: number) {
    this.networkId = networkId;
    this.styles = [];
    this.fetched = null;
  }

  get network(): number {
    return this.networkId;
  }

  public getStyles() {
    return this.styles;
  }

  public getStyle(tokenId: string) {
    return this.styles.find((s) => s.tokenId === tokenId);
  }

  async fetchAllStyles() {
    if (this.fetched !== null) return;

    console.debug('[%s] fetching style metadata', this.networkId);

    const splice = getSplice(this.networkId);
    const allStyles = await splice.getAllStyles();
    const styleCollection = await splice.getStyleNFT();

    const promises = allStyles.map((tokenMetadataResponse) => {
      const { tokenId, metadataUrl } = tokenMetadataResponse;
      return (async () => {
        const cacheKey = `${this.network}/styles/${tokenId}/style.json`;
        let metadata = await Cache.lookupJSON<StyleNFT>(cacheKey);

        if (!metadata) {
          const gwUrl = ipfsGW(metadataUrl);
          console.debug(
            `[%s] fetching style metadata from network`,
            this.networkId
          );
          metadata = await (await axios.get<StyleNFT>(gwUrl)).data;
          Cache.store(cacheKey, metadata);
        }

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
      this.styles = styles;
      styles.map((styleData) => {
        const { name, properties } = styleData.getMetadata();
        console.log(
          '[%s] style %d ready: %s by %s',
          this.networkId,
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
      const mdCache = new StyleMetadataCache(networkId);
      mdCache.fetchAllStyles().catch((e: any) => {
        console.error('cant setup cache on network', networkId, e.message);
      });
      this.caches[networkId] = mdCache;
    }
  }
}
