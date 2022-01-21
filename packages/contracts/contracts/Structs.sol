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

struct Partnership {
  address[] collections;
  address beneficiary;
  uint64 until;
  /// @notice exclusive partnerships mean that all style inputs must be covered by the partnership
  /// @notice unexclusive partnerships require only 1 input to be covered
  bool exclusive;
}

struct StyleSettings {
  //counting up
  uint32 mintedOfStyle;
  uint32 cap;
  ISplicePriceStrategy priceStrategy;
  bool salesIsActive;
  bool collectionConstrained;
  bool isFrozen;
  string styleCID;
  uint8 maxInputs;
  address paymentSplitter;
}
