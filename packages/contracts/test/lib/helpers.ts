import { BigNumber, utils, Event } from 'ethers';
import keccak256 from 'keccak256';

import { of as ipfsHashOf } from 'ipfs-only-hash';
import { SpliceStyleNFT } from '../../typechain';
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

export async function mintStyle(
  connectedStyleNFT: SpliceStyleNFT,
  priceStrategyAddress: string,
  options: {
    cap?: number;
    priceInEth?: string;
    saleIsActive?: boolean;
  } = {
    cap: 100,
    priceInEth: '0.1',
    saleIsActive: true
  }
): Promise<number> {
  const fakeCid = await ipfsHashOf(Buffer.from('{this: is: fake}'));

  const minPriceWei = utils.parseEther(options.priceInEth);
  const priceHex = minPriceWei.toHexString();
  const priceBytes = utils.hexZeroPad(priceHex, 32);

  const receipt = await (
    await connectedStyleNFT.mint(
      100,
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
