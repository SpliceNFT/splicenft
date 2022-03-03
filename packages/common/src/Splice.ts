import {
  Splice as SpliceContract,
  SpliceStyleNFT as StyleNFTContract,
  SpliceStyleNFT__factory as StyleNFTFactory,
  Splice__factory as SpliceFactory
} from '@splicenft/contracts';
import { MintedEvent } from '@splicenft/contracts/typechain/Splice';
import axios from 'axios';
import {
  BigNumber,
  BigNumberish,
  ethers,
  providers,
  Signer,
  utils
} from 'ethers';
import { erc721 } from '.';
import { ipfsGW } from './img';
import { SpliceNFT } from './types/SpliceNFT';
import { StyleMetadataResponse, UserSplice } from './types/TransferObjects';

type SpliceDeployInfo = {
  address: string;
  deployedAt: number;
  subgraph?: string;
  explorerRoot?: string;
  openSeaLink?: string;
};
export const SPLICE_ADDRESSES: Record<number, SpliceDeployInfo> = {
  4: {
    subgraph:
      'https://api.thegraph.com/subgraphs/name/elmariachi111/splicemultirinkeby',
    address: '0x25A1c61A2501A82bf24C31F5CdE375F56B72C397',
    deployedAt: 10082549,
    explorerRoot: 'rinkeby.etherscan.io',
    openSeaLink: 'testnets.opensea.io/collection/splice-v5'
  },
  //42: '0x231e5BA16e2C9BE8918cf67d477052f3F6C35036'
  1: {
    subgraph: 'https://api.thegraph.com/subgraphs/name/splicenft/splice',
    address: '0xB6D9BA151BcdD9169c8Ccd07DB63F306AA4a5b8E',
    deployedAt: 14152956,
    explorerRoot: 'etherscan.io',
    openSeaLink: 'opensea.io/collection/splice'
  }
};

export type ProvenanceOrigin = {
  collection: string;
  token_id: BigNumberish;
  metadata_url?: string;
};

export type TokenProvenance = {
  splice_token_id: BigNumber;
  //these are contained in splice_token_id @see tokenIdToStyleAndToken
  style_token_id: number;
  style_token_token_id: number;
  origins: Array<ProvenanceOrigin>;
};

//todo: restrict all filters to start searching from the deployed block number
export class Splice {
  private contract: SpliceContract;
  private deployedAtBlock: number;
  private styleNFTContract?: StyleNFTContract;

  get address() {
    return this.contract.address;
  }

  constructor(splice: SpliceContract) {
    this.contract = splice;
    this.deployedAtBlock = 0;
  }

  get providerOrSigner(): { provider: providers.Provider; signer: Signer } {
    return {
      provider: this.contract.provider,
      signer: this.contract.signer
    };
  }
  static from(
    address: string,
    signer: Signer | providers.Provider,
    deployedAt = 0
  ) {
    const spliceFactory = SpliceFactory.connect(address, signer);
    const contract = spliceFactory.attach(address);
    const spl = new Splice(contract);
    spl.deployedAtBlock = deployedAt;
    return spl;
  }

  public async getStyleNFT(): Promise<StyleNFTContract> {
    if (this.styleNFTContract) return this.styleNFTContract;

    const styleNFTAddress = await this.contract.styleNFT();

    this.styleNFTContract = StyleNFTFactory.connect(
      styleNFTAddress,
      this.contract.signer || this.contract.provider
    );
    return this.styleNFTContract;
  }

  public async getChain(): Promise<number> {
    const network = await this.contract.provider.getNetwork();
    return network.chainId;
  }

  public async ownerOf(tokenId: BigNumber | string): Promise<string> {
    return this.contract.ownerOf(tokenId);
  }

  public async getPlatformBeneficiary(): Promise<string> {
    return this.contract.platformBeneficiary();
  }

  public static tokenIdToStyleAndToken(tokenId: BigNumber): {
    style_token_id: number;
    token_id: number;
  } {
    const hxToken = utils.arrayify(utils.zeroPad(tokenId.toHexString(), 8));
    return {
      style_token_id: BigNumber.from(hxToken.slice(0, 4)).toNumber(),
      token_id: BigNumber.from(hxToken.slice(4)).toNumber()
    };
  }

  /**
   * same as in solidity
   */
  public static originHash(
    collectionAddress: string,
    originTokenId: string
  ): string {
    const abiCoder = ethers.utils.defaultAbiCoder;
    const bnToken = BigNumber.from(originTokenId);
    const hxToken = utils.hexZeroPad(bnToken.toHexString(), 32);
    const encoded = abiCoder.encode(
      ['address[]', 'uint256[]'],
      [[collectionAddress], [hxToken]]
    );

    return ethers.utils.keccak256(encoded);
  }

  //todo: allow tokenId to be BigNumber
  public static computeRandomness(
    collectionAddress: string,
    originTokenId: string
  ): number {
    //todo: check behaviour between this and solidity (js max int)
    //keccak256(abi.encodePacked(address(nft), token_id));

    const bytes = utils.arrayify(
      Splice.originHash(collectionAddress, originTokenId)
    );
    const _randomness = new DataView(bytes.buffer).getUint32(0);
    return _randomness;
  }

  public async quote(
    styleTokenId: number,
    collection: string,
    tokenId: ethers.BigNumberish
  ): Promise<BigNumber> {
    const quoteWei = await this.contract.quote(
      styleTokenId,
      [collection],
      [tokenId]
    );
    return quoteWei;
  }

  public async mint({
    origin_collection,
    origin_token_id,
    style_token_id,
    additionalData,
    mintingFee
  }: {
    origin_collection: string;
    origin_token_id: string | BigNumber;
    style_token_id: string | number;
    additionalData?: Uint8Array;
    mintingFee: ethers.BigNumber;
  }): Promise<{ transactionHash: string; provenance: TokenProvenance }> {
    const inputParams = ethers.utils.hexlify(additionalData || []);
    const tx = await this.contract.mint(
      [origin_collection],
      [origin_token_id],
      style_token_id,
      [],
      inputParams,
      {
        value: mintingFee
      }
    );
    const result = await tx.wait();

    const mintedEvent: MintedEvent =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result.events?.find((evt) => evt.event === 'Minted') as MintedEvent;
    if (!mintedEvent) {
      throw new Error('no Mint event captured in minting transaction');
    }
    const { style_token_id: _style_token_id, token_id: style_token_token_id } =
      Splice.tokenIdToStyleAndToken(mintedEvent.args.tokenId);
    return {
      transactionHash: result.transactionHash,
      provenance: {
        origins: [
          {
            collection: origin_collection,
            token_id: ethers.BigNumber.from(origin_token_id)
          }
        ],

        splice_token_id: mintedEvent.args.tokenId,
        style_token_id: _style_token_id,
        style_token_token_id
      }
    };
  }

  /**
   * @description find all splices for an origin
   */
  public async findProvenances(
    collectionAddress: string,
    tokenId: string
  ): Promise<TokenProvenance[]> {
    const originHash = Splice.originHash(collectionAddress, tokenId);

    const filter = this.contract.filters.Minted(originHash);
    const mintedEvents = await this.contract.queryFilter(
      filter,
      this.deployedAtBlock
    );

    if (mintedEvents.length === 0) return [];
    return mintedEvents.map((ev) => {
      const { style_token_id, token_id: style_token_token_id } =
        Splice.tokenIdToStyleAndToken(ev.args.tokenId);

      return {
        origins: [
          {
            collection: collectionAddress,
            token_id: ethers.BigNumber.from(tokenId)
          }
        ],
        splice_token_id: ev.args.tokenId,
        style_token_id,
        style_token_token_id
      };
    });
  }

  public async getProvenance(
    spliceTokenId: BigNumber
  ): Promise<TokenProvenance | null> {
    const bnTokenId: BigNumber =
      'string' === typeof spliceTokenId
        ? BigNumber.from(spliceTokenId)
        : spliceTokenId;

    const filter = this.contract.filters.Minted(null, spliceTokenId);
    const mintedEvents = await this.contract.queryFilter(
      filter,
      this.deployedAtBlock
    );
    if (mintedEvents.length == 0) return null;

    if (mintedEvents.length > 1)
      throw new Error('a token can only be minted once');

    const mintEvent = mintedEvents[0];
    const tx = await mintEvent.getTransaction();
    const inputData = this.contract.interface.decodeFunctionData(
      this.contract.interface.functions[
        'mint(address[],uint256[],uint32,bytes32[],bytes)'
      ],
      tx.data
    );

    const { style_token_id, token_id: style_token_token_id } =
      Splice.tokenIdToStyleAndToken(spliceTokenId);

    const origins = inputData.originCollections.map(
      (oCol: string, i: number) => ({
        collection: oCol,
        token_id: inputData.originTokenIds[i]
      })
    );
    return {
      origins,
      splice_token_id: bnTokenId,
      style_token_id,
      style_token_token_id
    };
  }

  public getOriginNftContract(address: string) {
    return erc721(
      this.providerOrSigner.signer || this.providerOrSigner.provider,
      address
    );
  }

  public async getMetadataUrl(
    tokenId: BigNumber | number | string
  ): Promise<string> {
    return await this.contract.tokenURI(tokenId);
  }

  public async getMetadata(provenance: TokenProvenance): Promise<SpliceNFT> {
    const _metadataUrl = await this.getMetadataUrl(provenance.splice_token_id);
    return this.fetchMetadata(_metadataUrl);
  }

  /**
   * adds the metadata url to the metadata result
   */
  public async fetchMetadata(metadataUrl: string): Promise<SpliceNFT> {
    const metadata = (await (
      await axios.get(ipfsGW(metadataUrl))
    ).data) as SpliceNFT;
    metadata.splice.metadataUrl = metadataUrl;
    return metadata;
  }

  //todo: this might become highly expensive without a subgraph
  public async getAllStyles(): Promise<StyleMetadataResponse[]> {
    const styleNFT = await this.getStyleNFT();
    const totalSupply = await styleNFT.totalSupply();

    const promises = [];

    for (let i = 0; i < Math.min(10, totalSupply.toNumber()); i++) {
      promises.push(
        (async () => {
          const tokenId = await styleNFT.tokenByIndex(i);
          const metadataUrl = await styleNFT.tokenURI(tokenId);
          return { tokenId: tokenId.toString(), metadataUrl };
        })()
      );
    }
    return Promise.all(promises);
  }

  public async getBalanceOf(owner: string) {
    return this.contract.balanceOf(owner);
  }

  /**
   * @description gets all splices an user owns *from chain*. Use an api call on the frontend instead.
   * @todo: fixme: this only reads incoming transfers and doesnt consider outgoing ones :D
   */
  public async getAllSplices(
    owner: string,
    splicesPerPage = 20
  ): Promise<UserSplice[]> {
    const balance = await this.contract.balanceOf(owner);
    if (balance.isZero()) return [];

    const filter = this.contract.filters.Transfer(null, owner);
    const transfers = await this.contract.queryFilter(filter);
    const promises = transfers.map((e) => {
      return (async (): Promise<UserSplice> => {
        const metadataUrl = await this.contract.tokenURI(e.args.tokenId);
        return {
          id: e.args.tokenId.toString(),
          metadata_url: metadataUrl,
          origins: []
        };
      })();
    });

    return Promise.all(promises);
  }
}
