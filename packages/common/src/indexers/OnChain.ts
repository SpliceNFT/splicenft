import axios from 'axios';
import { ethers } from 'ethers';
import { ChainOpt } from '../types/Chains';

import { NFTItem, NFTMetaData } from '../types/NFT';
import { NFTIndexer } from '../types/NFTIndexer';

export type KnownCollections = Record<ChainOpt, string[]>;

export interface MetadataResponse {
  name: string;
  description: string;
  contract_address: string;
  token_id: string;
  asset_url: string;
  metadata: NFTMetaData;
}

const ERC721ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'tokenURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256'
      }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      }
    ],
    name: 'mint',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  }
];

type ProviderOrSigner = ethers.providers.BaseProvider | ethers.Signer;

export class OnChain implements NFTIndexer {
  private proxyAddress: string | undefined;

  private collections: Record<string, ethers.Contract> = {};

  private provider: ProviderOrSigner;

  constructor(
    chain: ChainOpt,
    provider: ProviderOrSigner,
    knownCollections: KnownCollections,
    proxyAddress?: string
  ) {
    this.proxyAddress = proxyAddress;
    this.provider = provider;

    knownCollections[chain].forEach((contractAddress) => {
      this.collections[contractAddress] = new ethers.Contract(
        contractAddress,
        ERC721ABI,
        provider
      );
    });
  }

  public async getAllAssetsOfOwner(ownerAddress: string): Promise<NFTItem[]> {
    const items = await Promise.all(
      Object.keys(this.collections).map((coll: string) =>
        this.getNFTsOfOwner(coll, ownerAddress)
      )
    );

    const onlyWorkingAssets = <NFTItem[]>(
      items.flatMap((i) => i).filter((i) => i != null)
    );

    return onlyWorkingAssets;
  }

  protected async getNFTsOfOwner(
    collection: string,
    ownerAddress: string
  ): Promise<Array<NFTItem | null>> {
    const contract =
      this.collections[collection] ||
      new ethers.Contract(collection, ERC721ABI, this.provider);
    const bal = await contract.balanceOf(ownerAddress);
    const promises = [];
    for (let i = 0; i < bal; i++) {
      promises.push(
        (async () => {
          const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
          try {
            return await this._getAssetMetadata(contract, tokenId);
          } catch (e) {
            console.log(`failed loading asset ${collection}/${tokenId}`);
            return null;
          }
        })()
      );
    }
    return await Promise.all(promises);
  }

  private async _getAssetMetadata(
    c: ethers.Contract,
    tokenId: string
  ): Promise<MetadataResponse> {
    let tokenUrl: string = await c.tokenURI(tokenId);
    if (tokenUrl.startsWith('ipfs://')) {
      tokenUrl = tokenUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    let metaData: NFTMetaData;

    try {
      metaData = (
        await axios.get<NFTMetaData>(tokenUrl, {
          responseType: 'json'
        })
      ).data;
    } catch (e) {
      if (!this.proxyAddress) {
        throw e;
      } else {
        console.log('using proxy', this.proxyAddress);
        const res = await axios.get<NFTMetaData>(this.proxyAddress, {
          params: {
            url: tokenUrl
          },
          responseType: 'json'
        });
        metaData = res.data;
      }
    }

    return {
      name: metaData.name,
      description: metaData.description,
      contract_address: c.address,
      token_id: tokenId,
      asset_url: tokenUrl,
      metadata: metaData
    };
  }

  public async getAssetMetadata(
    collection: string,
    tokenId: string
  ): Promise<NFTItem> {
    const contract =
      this.collections[collection] ||
      new ethers.Contract(collection, ERC721ABI, this.provider);
    return this._getAssetMetadata(contract, tokenId);
  }
}
