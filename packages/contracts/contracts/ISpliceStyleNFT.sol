// contracts/ISpliceStyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './StyleSettings.sol';
import './ISplicePriceStrategy.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

interface ISpliceStyleNFT {
  function mint(
    uint16 _cap,
    string memory _metadataCID,
    ISplicePriceStrategy _priceStrategy,
    bytes32 _priceStrategyParameters
  ) external returns (uint256);

  function getSettings(uint256 token_id)
    external
    view
    returns (StyleSettings memory);

  function canMintOnStyle(uint256 style_token_id) public returns (bool);

  function incrementMintedPerStyle(uint256 style_token_id)
    external
    returns (uint16);

  function quoteFee(uint256 style_id, IERC721 nft)
    external
    view
    returns (uint256);
}
