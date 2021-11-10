// contracts/ISpliceStyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import './ISplicePriceStrategy.sol';

struct StyleSettings {
  uint32 cap;
  string styleCID;
  ISplicePriceStrategy priceStrategy;
  bytes32 priceParameters;
  uint32 mintedOfStyle;
}
