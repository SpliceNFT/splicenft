// contracts/ISpliceStyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './StyleSettings.sol';
import './ISplicePriceStrategy.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

interface ISpliceStyleNFT is IERC721 {
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

  function mintsLeft(uint256 style_token_id) external view returns (uint16);

  function canMintOnStyle(uint256 style_token_id) external view returns (bool);

  //todo: important! if this must be marked "external" it definitely mustn't be called externally
  function incrementMintedPerStyle(uint256 style_token_id)
    external
    returns (uint16);

  function quoteFee(IERC721 nft, uint256 style_token_id)
    external
    view
    returns (uint256);
}
