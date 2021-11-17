// contracts/ISpliceStyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import './ISplicePriceStrategy.sol';

struct Allowlist {
  //counting down
  uint32 numReserved;
  uint64 reservedUntil;
  uint8 mintsPerAddress;
  bytes32 merkleRoot;
}

struct StyleSettings {
  //counting up
  uint32 mintedOfStyle;
  uint32 cap;
  ISplicePriceStrategy priceStrategy;
  bytes32 priceParameters;
  bool salesIsActive;
  bool collectionConstrained;
  bool isFrozen;
  string styleCID;
}
