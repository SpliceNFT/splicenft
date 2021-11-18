// contracts/SpliceStaticPriceStrategy.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import './StyleSettings.sol';
import './ISplicePriceStrategy.sol';
import './SpliceStyleNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract SplicePriceStrategyStatic is ISplicePriceStrategy {
  function quote(
    SpliceStyleNFT styleNFT,
    IERC721 collection,
    uint256 token_id,
    StyleSettings memory styleSettings
  ) external pure override returns (uint256) {
    return uint256(styleSettings.priceParameters);
  }
}
