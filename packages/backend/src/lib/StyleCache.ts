import { ActiveStyle, ipfsGW, Style, StyleNFT } from '@splicenft/common';
import axios from 'axios';
import * as Cache from './Cache';
import { getSplice } from './SpliceContracts';

export class StyleMetadataCache {
  private styles: ActiveStyle[];
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

  public getStyle(tokenId: number) {
    return this.styles.find((s) => s.tokenId === tokenId);
  }

  async fetchAllStyles() {
    if (this.fetched !== null) return;

    console.debug('[%s] fetching styles metadata', this.networkId);

    const splice = await getSplice(this.networkId);
    const styleNFTContract = splice.getStyleNFT();
    const allStyles = await splice.getAllStyles();

    const promises: Array<Promise<ActiveStyle>> = allStyles.map(
      (tokenMetadataResponse) => {
        const { tokenId, metadataUrl } = tokenMetadataResponse;
        return (async () => {
          const metadata = await Cache.withCache<StyleNFT>(
            `${this.network}/styles/${tokenId}/style.json`,
            async () => {
              const gwUrl = ipfsGW(metadataUrl);
              console.debug(
                `[%s] fetching style metadata [%s] from ipfs`,
                this.networkId,
                tokenId
              );
              const metadata = await (await axios.get<StyleNFT>(gwUrl)).data;
              return metadata;
            }
          );

          const _style = new Style(
            parseInt(tokenId),
            metadataUrl,
            metadata,
            `/styles/${this.networkId}/${tokenId}`
          );

          //preload code
          const codeCacheKey = `${this.network}/styles/${tokenId}/code.js`;
          let code = await Cache.lookupString(codeCacheKey);
          if (!code) {
            code = await _style.getCode();
            Cache.store(codeCacheKey, code);
          } else {
            _style.setCode(code);
          }
          const style = new ActiveStyle(_style, styleNFTContract);

          return style;
        })();
      }
    );

    Promise.all(promises).then((styles: ActiveStyle[]) => {
      this.styles = styles;
      styles.map((style) => {
        const { name, splice } = style.getMetadata();
        console.log(
          '[%s] style %d ready: %s by %s',
          this.networkId,
          style.tokenId,
          name,
          //todo: remove compat "?." (earlier these props have been part of "properties")
          splice?.creator_name
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
      mdCache
        .fetchAllStyles()
        .then(() =>
          console.debug('style cache on network %i is ready.', networkId)
        )
        .catch((e: any) => {
          console.error(
            'cant setup style cache on network %s. Message:',
            networkId,
            e.message
          );
        });
      this.caches[networkId] = mdCache;
    }
  }
}

export const styleCache = new StyleCache([1, 4, 31337]);
