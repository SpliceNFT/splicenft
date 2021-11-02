// contracts/ISplicePriceStrategy.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './StyleSettings.sol';
import './ISpliceStyleNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

error QuoteNotImplemented();

/**
 * this is a powerful interface to allow non linear pricing.
 * You could e.g. invent a strategy that increases a base price
 * according to how many items already have been minted.
 * or it could decrease the minting fee depending on when
 * the last style mint has happened, etc.
 * The "parameters" argument will be interpreted differently by
 * implementers. For a simple static price strategy it simply will
 * be converted to a uint256 for a constant minting fee.
 */
interface ISplicePriceStrategy {
  function quote(
    ISpliceStyleNFT styleNFT,
    IERC721 collection,
    uint256 token_id,
    StyleSettings memory styleSettings
  ) external view returns (uint256);
}
