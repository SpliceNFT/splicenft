import { ethers } from 'ethers';

export const AllowlistTypes = {
  AllowlistRequest: [
    { name: 'style_token_id', type: 'string' },
    { name: 'from', type: 'address' }
  ]
};

export function verifyAllowlistEntry(
  chainId: number,
  styleTokenId: string,
  account: string,
  signature: string
): boolean {
  const verifiedAddress = ethers.utils.verifyTypedData(
    {
      chainId: chainId,
      name: 'Splice Allowlist',
      version: '1'
    },
    AllowlistTypes,
    {
      style_token_id: styleTokenId,
      from: account
    },
    signature
  );

  return verifiedAddress === account;
}
