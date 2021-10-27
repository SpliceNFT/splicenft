// contracts/SpliceStaticPriceStrategy.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './ISplicePriceStrategy.sol';
import './ISpliceStyleNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract SplicePriceStrategyStatic is ISplicePriceStrategy {
  uint256 private fee;

  constructor(uint256 fee_) {
    fee = fee_;
  }

  function quote(
    ISpliceStyleNFT styleNFT,
    IERC721 collection,
    uint256 token_id,
    bytes32 parameters
  ) external view override returns (uint256) {
    return uint256(parameters);
  }
}
