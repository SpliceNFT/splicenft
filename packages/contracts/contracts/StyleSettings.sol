// contracts/ISpliceStyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './ISplicePriceStrategy.sol';

struct StyleSettings {
  uint16 cap;
  string styleCID;
  ISplicePriceStrategy priceStrategy;
  bytes32 priceParameters;
  uint16 mintedOfStyle;
}
