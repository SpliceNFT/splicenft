import {
  ISplicePriceStrategy,
  ISplicePriceStrategy__factory,
  ReplaceablePaymentSplitter,
  ReplaceablePaymentSplitter__factory,
  SpliceStyleNFT
} from '@splicenft/contracts';
import { StyleSettingsStructOutput } from '@splicenft/contracts/typechain/contracts/SpliceStyleNFT';
import { ethers } from 'ethers';
import { Renderer, StyleNFT } from '.';
import { Style } from './Style';
import { Partnership, StyleStatsData } from './types/Styles';

export class ActiveStyle {
  private style: Style;
  private contract: SpliceStyleNFT;
  private _stats: StyleStatsData | undefined;
  private _settings: StyleSettingsStructOutput | undefined;

  constructor(style: Style, contract: SpliceStyleNFT) {
    this.style = style;
    this.contract = contract;
  }

  public get tokenId(): number {
    return this.style.tokenId;
  }

  public async getCode(): Promise<string> {
    return this.style.getCode();
  }

  public getMetadata(): StyleNFT {
    return this.style.getMetadata();
  }

  public getRenderer(): Promise<Renderer> {
    return this.style.getRenderer();
  }

  public getMetadataUrl(): string {
    return this.style.getMetadataUrl();
  }

  getCollectionAddress() {
    return this.contract.address;
  }

  async stats(): Promise<StyleStatsData> {
    if (this._stats) return this._stats;

    const settings = await this.contract.getSettings(this.tokenId);
    const owner = await this.contract.ownerOf(this.tokenId);
    // const active = await this.contract.isSaleActive(this.tokenId);
    // const reserved = await this.contract.reservedTokens(this.tokenId);

    this._stats = {
      style: {
        id: this.tokenId.toString(),
        cap: settings.cap,
        minted: settings.mintedOfStyle,
        owner,
        priceStrategy: settings.priceStrategy,
        split: {
          payments: []
        }
      }
    };
    return this._stats;
  }

  async quote(
    collection: string,
    tokenId: ethers.BigNumberish
  ): Promise<ethers.BigNumber> {
    return this.contract.quoteFee(this.tokenId, [collection], [tokenId]);
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

  async toggleActive(newVal: boolean): Promise<boolean> {
    await this.contract.toggleSaleIsActive(this.tokenId, newVal);
    return newVal;
  }

  async isStyleActive(): Promise<boolean> {
    return this.contract.isSaleActive(this.tokenId);
  }
  async settings(): Promise<StyleSettingsStructOutput> {
    if (this._settings) return this._settings;
    this._settings = await this.contract.getSettings(this.tokenId);
    return this._settings;
  }

  async paymentSplitter(): Promise<ReplaceablePaymentSplitter> {
    return ReplaceablePaymentSplitter__factory.connect(
      (await this.settings()).paymentSplitter,
      this.contract.provider
    );
  }

  async priceStrategy(): Promise<ISplicePriceStrategy> {
    return ISplicePriceStrategy__factory.connect(
      (await this.settings()).priceStrategy,
      this.contract.provider
    );
  }
  async partnership(): Promise<Partnership | undefined> {
    const partnership = await this.contract.getPartnership(this.tokenId);
    if (partnership.collections.length === 0) return undefined;

    return {
      collections: partnership.collections,
      exclusive: partnership.exclusive,
      until: new Date(partnership.until.toNumber() * 1000)
    };
  }

  async isStyleMinter(account: string): Promise<boolean> {
    return this.contract.isStyleMinter(account);
  }
}
