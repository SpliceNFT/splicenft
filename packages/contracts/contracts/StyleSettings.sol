// contracts/ISpliceStyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import './ISplicePriceStrategy.sol';

struct Allowlist {
  //counting down
  uint32 numReserved;
  bytes32 merkleRoot;
  uint64 reservedUntil;
  uint8 mintsPerAddress;
}

struct StyleSettings {
  uint32 cap;
  string styleCID;
  ISplicePriceStrategy priceStrategy;
  bytes32 priceParameters;
  bool salesIsActive;
  //counting up
  uint32 mintedOfStyle;
  bool collectionConstrained;
}
