import { ERC721, ERC721Enumerable } from '@splicenft/contracts';
import axios from 'axios';
import { ethers } from 'ethers';
import { erc721Enumerable, ipfsGW } from '..';
import { ChainOpt } from '../types/Chains';
import { NFTItemInTransit, NFTMetaData } from '../types/NFT';
import { NFTIndexer } from './NFTIndexer';

export type KnownCollections = Record<ChainOpt, string[]>;

export interface MetadataResponse {
  name: string;
  description: string;
  contract_address: string;
  token_id: string;
  asset_url: string;
  metadata: NFTMetaData;
}

type ProviderOrSigner = ethers.providers.BaseProvider | ethers.Signer;

export class OnChain implements NFTIndexer {
  private proxyAddress: string | undefined;

  private collections: Record<string, ERC721Enumerable> = {};

  private provider: ProviderOrSigner;

  public getCollections(): ERC721Enumerable[] {
    return Object.values(this.collections);
  }

  constructor(
    provider: ProviderOrSigner,
    addressList: string[],
    proxyAddress?: string
  ) {
    this.proxyAddress = proxyAddress;
    this.provider = provider;

    addressList.forEach((knownCollection) => {
      this.collections[knownCollection] = erc721Enumerable(
        provider,
        knownCollection
      );
    });
  }

  public async getAllAssetsOfOwner(
    ownerAddress: string
  ): Promise<NFTItemInTransit[]> {
    const items = await Promise.all(
      Object.keys(this.collections).map((coll: string) =>
        this.getNFTsOfOwner(coll, ownerAddress)
      )
    );

    const onlyWorkingAssets = <NFTItemInTransit[]>(
      items.flatMap((i) => i).filter((i) => i != null)
    );

    return onlyWorkingAssets;
  }

  protected async getNFTsOfOwner(
    collection: string,
    ownerAddress: string
  ): Promise<Array<NFTItemInTransit | null>> {
    const contract =
      this.collections[collection] ||
      erc721Enumerable(this.provider, collection);
    const bal = (await contract.balanceOf(ownerAddress)).toNumber();
    const promises: Array<Promise<NFTItemInTransit>> = [];
    for (let i = 0; i < bal; i++) {
      promises.push(
        (async () => {
          const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
          const metaData = this._getAssetMetadata(contract, tokenId.toString());
          return {
            contract_address: contract.address,
            token_id: tokenId.toString(),
            metadata: metaData
          };
        })()
      );
    }
    return Promise.all(promises);
  }

  public async _getAssetMetadata(
    e721: ERC721,
    tokenId: string
  ): Promise<NFTMetaData | null> {
    const tokenUrl: string = ipfsGW(await e721.tokenURI(tokenId));

    let metaData: NFTMetaData | null = null;

    try {
      metaData = (
        await axios.get<NFTMetaData>(tokenUrl, {
          responseType: 'json'
        })
      ).data;
    } catch (e) {
      if (this.proxyAddress) {
        const res = await axios.get<NFTMetaData>(this.proxyAddress, {
          params: {
            url: tokenUrl
          },
          responseType: 'json'
        });
        metaData = res.data;
      }
    }
    return metaData;
  }

  public async getAssetMetadata(
    collection: string,
    tokenId: string
  ): Promise<NFTMetaData | null> {
    const contract =
      this.collections[collection] ||
      erc721Enumerable(this.provider, collection);
    return this._getAssetMetadata(contract, tokenId);
  }
}
