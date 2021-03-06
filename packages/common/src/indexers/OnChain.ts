import { ERC721Enumerable } from '@splicenft/contracts';
import { ethers } from 'ethers';
import { erc721Enumerable, ipfsGW } from '..';
import { ChainOpt } from '../types/Chains';
import { NFTItemInTransit, NFTItem, NFTMetaData } from '../types/NFT';
import { fetchMetadataFromUrl, NFTIndexer } from './NFTIndexer';

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
interface OnChainOptions {
  proxyAddress?: string | undefined;
  metadataProxy?: string | undefined;
}

export class OnChain implements NFTIndexer {
  private options: OnChainOptions;

  private collections: Record<string, ERC721Enumerable> = {};

  private provider: ProviderOrSigner;

  public getCollections(): ERC721Enumerable[] {
    return Object.values(this.collections);
  }

  constructor(
    provider: ProviderOrSigner,
    addressList: string[],
    options?: OnChainOptions
  ) {
    this.options = options || {};
    this.provider = provider;

    addressList.forEach((knownCollection) => {
      this.collections[knownCollection] = erc721Enumerable(
        provider,
        knownCollection
      );
    });
  }
  canBeContinued(): boolean {
    return false;
  }
  reset() {
    return;
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
          try {
            const metaData = fetchMetadataFromUrl(
              ipfsGW(await contract.tokenURI(tokenId)),
              this.options.proxyAddress
            );

            return {
              contract_address: contract.address,
              token_id: tokenId.toString(),
              metadata: metaData
            };
          } catch (e: any) {
            console.warn(`couldnt load ${collection}/${tokenId}: ${e.message}`);
            return {
              contract_address: contract.address,
              token_id: tokenId.toString(),
              metadata: null
            };
          }
        })()
      );
    }
    return Promise.all(promises);
  }

  public async getAsset(collection: string, tokenId: string): Promise<NFTItem> {
    const contract =
      this.collections[collection] ||
      erc721Enumerable(this.provider, collection);
    const tokenUri = await contract.tokenURI(tokenId);

    const metadataUrl = ipfsGW(tokenUri);
    const metadata = await fetchMetadataFromUrl(
      metadataUrl,
      this.options.proxyAddress
    );

    return {
      contract_address: collection,
      token_id: tokenId,
      name: metadata.name,
      description: metadata.description,
      metadata
    };
  }
}
