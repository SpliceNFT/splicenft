import { BigNumber, utils, Event, Signer, constants } from 'ethers';
import keccak256 from 'keccak256';

import { of as ipfsHashOf } from 'ipfs-only-hash';
import { Splice, SpliceStyleNFT, TestnetNFT } from '../../typechain';
import { TransferEvent } from '../../typechain/ERC721';
import { MerkleTree } from 'merkletreejs';

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
  const { cap, priceInEth, saleIsActive }: MintStyleOptions = {
    cap: 100,
    priceInEth: '0.1',
    saleIsActive: true,
    ...options
  };

  const fakeCid = await ipfsHashOf(Buffer.from('{this: is: fake}'));

  const minPriceWei = utils.parseEther(priceInEth);
  const priceHex = minPriceWei.toHexString();
  const priceBytes = utils.hexZeroPad(priceHex, 32);

  const receipt = await (
    await connectedStyleNFT.mint(
      cap,
      fakeCid,
      priceStrategyAddress,
      priceBytes,
      saleIsActive
    )
  ).wait();

  const transferEvent = receipt.events?.find(
    (e: Event) => e.event === 'Transfer'
  );
  const tokenId = (transferEvent as TransferEvent).args.tokenId;
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
  nftAddress: string,
  originTokenId: number,
  styleTokenId: number
): Promise<BigNumber> {
  const fee = splice.quote(nftAddress, styleTokenId);
  const receipt = await (
    await splice.mint(
      nftAddress,
      originTokenId,
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
