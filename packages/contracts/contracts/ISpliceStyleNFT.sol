// contracts/ISpliceStyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import './StyleSettings.sol';
import './ISplicePriceStrategy.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

interface ISpliceStyleNFT is IERC721 {
  function mint(
    uint32 _cap,
    string memory _metadataCID,
    ISplicePriceStrategy _priceStrategy,
    bytes32 _priceStrategyParameters
  ) external returns (uint32 style_token_id);

  function getSettings(uint32 style_token_id)
    external
    view
    returns (StyleSettings memory);

  function mintsLeft(uint32 style_token_id) external view returns (uint32);

  function canMintOnStyle(uint32 style_token_id) external view returns (bool);

  //todo: important! the interface requires us to mark this "external".
  // it definitely mustn't be called externally (but only by the splice contract)
  function incrementMintedPerStyle(uint32 style_token_id)
    external
    returns (uint32);

  function quoteFee(IERC721 nft, uint32 style_token_id)
    external
    view
    returns (uint256 fee);
}
