// contracts/ISplicePriceStrategy.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import './Structs.sol';
import './SpliceStyleNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

/**
 * this is a powerful interface to allow non linear pricing.
 * You could e.g. invent a strategy that increases a base price
 * according to how many items already have been minted.
 * or it could decrease the minting fee depending on when
 * the last style mint has happened, etc.
 */
interface ISplicePriceStrategy {
  function quote(
    uint256 style_token_id,
    IERC721[] memory collections,
    uint256[] memory token_ids
  ) external view returns (uint256);

  function onMinted(uint256 style_token_id) external;
}
