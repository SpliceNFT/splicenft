import { BigNumber, utils } from 'ethers';
import { of as ipfsHashOf } from 'ipfs-only-hash';
import { SpliceStyleNFT } from '../../typechain';

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
  priceInEth: string,
  saleIsActive: boolean
) {
  const fakeCid = await ipfsHashOf(Buffer.from('{this: is: fake}'));

  const minPriceWei = utils.parseEther(priceInEth);
  const priceHex = minPriceWei.toHexString();
  const priceBytes = utils.hexZeroPad(priceHex, 32);

  await (
    await connectedStyleNFT.mint(
      100,
      fakeCid,
      priceStrategyAddress,
      priceBytes,
      saleIsActive
    )
  ).wait();
}
