import { ethers } from 'ethers';

export type PaymentInfo = {
  total: ethers.BigNumber;
  totalReleased: ethers.BigNumber;
  shares: number;
  due: ethers.BigNumber;
};
