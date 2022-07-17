import { BigNumber, constants, Event, Signer, utils } from 'ethers';
import keccak256 from 'keccak256';

import { of as ipfsHashOf } from 'ipfs-only-hash';
import { MerkleTree } from 'merkletreejs';
import {
  Splice,
  SplicePriceStrategyStatic__factory,
  SpliceStyleNFT,
  TestnetNFT
} from '../../typechain';
import { TransferEvent } from '../../typechain/contracts/TestnetNFT';


export function tokenIdToStyleAndToken(tokenId: BigNumber): {
  style_token_id: number;
  token_id: number;
} {
  const hxToken = utils.arrayify(utils.zeroPad(tokenId.toHexString(), 8));
  return {
    style_token_id: BigNumber.from(hxToken.slice(0, 4)).toNumber(),
    token_id: BigNumber.from(hxToken.slice(4)).toNumber()
  };
}

interface MintStyleOptions {
  cap?: number;
  priceInEth?: string;
  saleIsActive?: boolean;
  cid?: string;
  maxInputs?: number;
  partner?: string;
  artist?: string;
}

export async function mintTestnetNFT(
  contract: TestnetNFT,
  to: Signer
): Promise<number> {
  const _nft = await contract.connect(to);
  const toAddress = await to.getAddress();

  const transaction = await _nft.mint(toAddress);
  const receipt = await transaction.wait();

  const transferEvent = receipt.events?.find(
    (e: Event) => e.event === 'Transfer'
  );
  const tokenId = (transferEvent as TransferEvent).args.tokenId;
  return tokenId.toNumber();
}

export async function mintStyle(
  connectedStyleNFT: SpliceStyleNFT,
  priceStrategyAddress: string,
  options?: MintStyleOptions
): Promise<number> {
  const {
    cap,
    priceInEth,
    saleIsActive,
    cid,
    maxInputs,
    artist,
    partner
  }: MintStyleOptions = {
    cap: 100,
    priceInEth: '0.1',
    saleIsActive: true,
    maxInputs: 1,
    artist: constants.AddressZero,
    partner: constants.AddressZero,
    ...options
  };

  const fakeCid = cid || (await ipfsHashOf(Buffer.from('{this: is: fake}')));

  const receipt = await (
    await connectedStyleNFT.mint(
      cap,
      fakeCid,
      priceStrategyAddress,
      saleIsActive,
      maxInputs,
      artist,
      partner
    )
  ).wait();

  const transferEvent = receipt.events?.find(
    (e: Event) => e.event === 'Transfer'
  );
  const tokenId = (transferEvent as TransferEvent).args.tokenId;

  const priceStrategy = SplicePriceStrategyStatic__factory.connect(
    priceStrategyAddress,
    connectedStyleNFT.signer
  );
  await priceStrategy.setPrice(tokenId, utils.parseEther(priceInEth));

  return tokenId.toNumber();
}

export function createMerkleProof(allowedAddresses: string[]): MerkleTree {
  const leaves = allowedAddresses.map((x) => keccak256(x));
  return new MerkleTree(leaves, keccak256, {
    sort: true
  });
}

export async function mintSplice(
  splice: Splice,
  nftAddress: string | string[],
  originTokenId: number | number[],
  styleTokenId: number
): Promise<BigNumber> {
  const nftAddresses = Array.isArray(nftAddress) ? nftAddress : [nftAddress];
  const originTokenIds = Array.isArray(originTokenId)
    ? originTokenId
    : [originTokenId];

  const fee = splice.quote(styleTokenId, nftAddresses, originTokenIds);
  const receipt = await (
    await splice.mint(
      nftAddresses,
      originTokenIds,
      styleTokenId,
      [],
      constants.HashZero,
      {
        value: fee
      }
    )
  ).wait();

  const transferEvent = receipt.events?.find(
    (e: Event) => e.event === 'Transfer'
  );

  return (transferEvent as TransferEvent).args.tokenId;
}

export function originHash(
  collectionAddress: string,
  originTokenId: BigNumber
): string {
  const abiCoder = utils.defaultAbiCoder;
  const bnToken = BigNumber.from(originTokenId);
  const hxToken = utils.hexZeroPad(bnToken.toHexString(), 32);
  const encoded = abiCoder.encode(
    ['address[]', 'uint256[]'],
    [[collectionAddress], [hxToken]]
  );

  return utils.keccak256(encoded);
}
