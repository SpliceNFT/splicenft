// contracts/StyleNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/utils/math/SafeCast.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './ISpliceStyleNFT.sol';
import './ISplicePriceStrategy.sol';
import './StyleSettings.sol';

contract SpliceStyleNFTV1 is ERC721Enumerable, Ownable, ISpliceStyleNFT {
  using Counters for Counters.Counter;
  using SafeCast for uint256;

  Counters.Counter private _styleTokenIds;

  mapping(address => bool) public isArtist;
  mapping(uint32 => StyleSettings) styleSettings;

  address public spliceNFT;

  constructor()
    ERC721('Splice Style NFT V1', 'SPLSV1')
    ERC721Enumerable()
    Ownable()
  {}

  modifier onlyArtist() {
    require(isArtist[msg.sender] == true, 'only artists can mint styles');
    _;
  }

  modifier onlySplice() {
    require(msg.sender == spliceNFT, 'only callable by Splice');
    _;
  }

  function setSplice(address _spliceNFT) external onlyOwner {
    spliceNFT = _spliceNFT;
  }

  function allowArtist(address artist) external onlyOwner {
    isArtist[artist] = true;
  }

  function disallowArtist(address artist) external onlyOwner {
    require(isArtist[artist], "the artist wasn't allowed anyway");
    isArtist[artist] = false;
  }

  /**
   * we assume that our metadata CIDs are folder roots containing a /metadata.json
   * that's how nft.storage does it.
   */
  function _metadataURI(string memory metadataCID)
    private
    pure
    returns (string memory)
  {
    return string(abi.encodePacked('ipfs://', metadataCID, '/metadata.json'));
  }

  function tokenURI(uint32 tokenId) public view returns (string memory) {
    require(
      _exists(tokenId),
      'ERC721Metadata: URI query for nonexistent token'
    );
    string memory metadataCID = styleSettings[tokenId].styleCID;
    require((bytes(metadataCID).length > 0), 'no CID stored');
    return _metadataURI(metadataCID);
  }

  function quoteFee(IERC721 nft, uint32 style_token_id)
    external
    view
    override
    returns (uint256 fee)
  {
    StyleSettings memory settings = styleSettings[style_token_id];
    fee = settings.priceStrategy.quote(this, nft, style_token_id, settings);
  }

  function getSettings(uint32 style_token_id)
    public
    view
    override
    returns (StyleSettings memory)
  {
    return styleSettings[style_token_id];
  }

  function mintsLeft(uint32 style_token_id)
    public
    view
    override
    returns (uint32)
  {
    StyleSettings memory settings = styleSettings[style_token_id];
    return settings.cap - settings.mintedOfStyle;
  }

  function canMintOnStyle(uint32 style_token_id)
    public
    view
    override
    returns (bool)
  {
    return (mintsLeft(style_token_id) > 0);
  }

  //todo: IMPORTANT check that this really can only be called by the Splice contract!
  //https://ethereum.org/de/developers/tutorials/interact-with-other-contracts-from-solidity/
  //https://medium.com/@houzier.saurav/calling-functions-of-other-contracts-on-solidity-9c80eed05e0f
  function incrementMintedPerStyle(uint32 style_token_id)
    external
    override
    onlySplice
    returns (uint32)
  {
    require(canMintOnStyle(style_token_id), 'the style has been fully minted');
    styleSettings[style_token_id].mintedOfStyle += 1;
    return styleSettings[style_token_id].mintedOfStyle;
  }

  function mint(
    uint32 _cap,
    string memory _metadataCID,
    ISplicePriceStrategy _priceStrategy,
    bytes32 _priceStrategyParameters
  ) external override onlyArtist returns (uint32 style_token_id) {
    //EFFECTS
    _styleTokenIds.increment();
    style_token_id = _styleTokenIds.current().toUint32();

    styleSettings[style_token_id] = StyleSettings({
      cap: _cap,
      styleCID: _metadataCID,
      priceStrategy: _priceStrategy,
      priceParameters: _priceStrategyParameters,
      mintedOfStyle: 0
    });

    //INTERACTIONS
    _safeMint(msg.sender, style_token_id);
  }
}
