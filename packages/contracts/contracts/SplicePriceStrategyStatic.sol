// contracts/SpliceStaticPriceStrategy.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import './Structs.sol';
import './ISplicePriceStrategy.sol';
import './SpliceStyleNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract SplicePriceStrategyStatic is ISplicePriceStrategy {
  mapping(uint256 => uint256) mintPrice;
  SpliceStyleNFT styleNFT;

  constructor(SpliceStyleNFT styleNFT_) {
    styleNFT = styleNFT_;
  }

  function setPrice(uint256 tokenId, uint256 price) external {
    if (
      !styleNFT.isStyleMinter(msg.sender) &&
      msg.sender != styleNFT.ownerOf(tokenId)
    ) {
      revert('not controlling the style');
    }

    mintPrice[tokenId] = price;
  }

  function quote(
    uint256 style_token_id,
    IERC721[] memory collections,
    uint256[] memory token_ids
  ) external view override returns (uint256) {
    return mintPrice[style_token_id];
  }

  function onMinted(uint256 style_token_id) external {}
}
