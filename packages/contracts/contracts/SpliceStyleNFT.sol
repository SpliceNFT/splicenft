// contracts/StyleNFT.sol
// SPDX-License-Identifier: MIT

/*
     LCL  SSL      CSL  SSL      LCI       ISL       LCL  ISL        CI  ISL
     PEE  EEL      EES LEEL      IEE       EEI       PEE  EES       LEEL EES
     PEE  EEL      EES LEEL      IEE       EEI       PEE  EES       LEEL EES
     PEE  EEL      EES LEEL      IEE       LL        PEE  EES       LEEL LL 
     PEE  EEL      EES LEEL      IEE                 PEE  EES       LEEL    
     PEE  EEL      EES LEEL      IEE                 PEE  EES       LEEL LLL
     PEE  LL       EES LEEL      IEE       IPL       PEE  LLL       LEEL EES
LLL  PEE           EES  SSL      IEE       PEC       PEE  LLL       LEEL EES
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL LLL
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL    
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL LL 
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL EES
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL EES
LSI  LSI           LCL           LSS       ISL       LSI  ISL       LSS  ISL
*/

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './ISplicePriceStrategy.sol';
import './StyleSettings.sol';

contract SpliceStyleNFT is
  ERC721EnumerableUpgradeable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable
{
  using CountersUpgradeable for CountersUpgradeable.Counter;
  using SafeCastUpgradeable for uint256;

  error BadReservationParameters(uint32 reservation, uint32 mintsLeft);
  error AllowlistDurationTooShort(uint256 diff);

  /// @notice you wanted to set an allowlist on a style that already got one
  error AllowlistNotOverridable(uint32 style_token_id);

  /// @notice someone wanted to modify the style NFT without owning it.
  error NotControllingStyle(uint32 style_token_id);

  /// @notice The style cap has been reached. You can't mint more items using that style
  error StyleIsFullyMinted();

  /// @notice Sales is not active on the style
  error SaleNotActive(uint32 style_token_id);

  /// @notice Reservation limit exceeded
  error PersonalReservationLimitExceeded(uint32 style_token_id);

  /// @notice
  error NotEnoughTokensToMatchReservation(uint32 style_token_id);

  /// @notice
  error StyleIsFrozen();

  error CantFreezeAnUncompleteCollection(uint32 mintsLeft);
  error InvalidCID();

  //https://docs.opensea.io/docs/metadata-standards#ipfs-and-arweave-uris
  event PermanentURI(string _value, uint256 indexed _id);
  event Minted(uint32 indexed style_token_id, uint32 cap, string metadataCID);
  event AllowlistInstalled(
    uint32 indexed style_token_id,
    uint32 reserved,
    uint8 mintsPerAddress,
    uint64 until
  );

  CountersUpgradeable.Counter private _styleTokenIds;

  mapping(address => bool) public isStyleMinter;
  mapping(uint32 => StyleSettings) styleSettings;
  mapping(uint32 => Allowlist) allowlists;

  /// @notice how many pieces has an (allowed) address already minted on a style
  mapping(uint32 => mapping(address => uint8)) mintsAlreadyAllowed;
  mapping(uint32 => mapping(address => bool)) collectionAllowed;

  address public spliceNFT;

  function initialize() public initializer {
    __ERC721_init('Splice Style NFT', 'SPLYLE');
    __ERC721Enumerable_init_unchained();
    __Ownable_init_unchained();
    __ReentrancyGuard_init();
  }

  modifier onlyStyleMinter() {
    require(isStyleMinter[msg.sender] == true, 'not allowed to mint styles');
    _;
  }

  modifier onlySplice() {
    require(msg.sender == spliceNFT, 'only callable by Splice');
    _;
  }

  function setSplice(address _spliceNFT) external onlyOwner {
    if (spliceNFT != address(0)) {
      revert('can only be called once.');
    }
    spliceNFT = _spliceNFT;
  }

  function toggleStyleMinter(address minter, bool newValue) external onlyOwner {
    isStyleMinter[minter] = newValue;
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

  function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
  {
    require(_exists(tokenId), 'nonexistent token');
    return _metadataURI(styleSettings[uint32(tokenId)].styleCID);
  }

  function quoteFee(IERC721 nft, uint32 style_token_id)
    external
    view
    returns (uint256 fee)
  {
    fee = styleSettings[style_token_id].priceStrategy.quote(
      this,
      nft,
      style_token_id,
      styleSettings[style_token_id]
    );
  }

  function getSettings(uint32 style_token_id)
    public
    view
    returns (StyleSettings memory)
  {
    return styleSettings[style_token_id];
  }

  function isSaleActive(uint32 style_token_id) public view returns (bool) {
    return styleSettings[style_token_id].salesIsActive;
  }

  function toggleSaleIsActive(uint32 style_token_id, bool newValue) public {
    if (ownerOf(style_token_id) != msg.sender) {
      revert NotControllingStyle(style_token_id);
    }

    if (isFrozen(style_token_id)) {
      revert StyleIsFrozen();
    }
    styleSettings[style_token_id].salesIsActive = newValue;
  }

  function mintsLeft(uint32 style_token_id) public view returns (uint32) {
    return
      styleSettings[style_token_id].cap -
      styleSettings[style_token_id].mintedOfStyle;
  }

  function reservedTokens(uint32 style_token_id) public view returns (uint32) {
    if (block.timestamp > allowlists[style_token_id].reservedUntil) {
      //reservation period has ended
      return 0;
    }
    return allowlists[style_token_id].numReserved;
  }

  function availableForPublicMinting(uint32 style_token_id)
    public
    view
    returns (uint32)
  {
    if (!isSaleActive(style_token_id)) {
      revert SaleNotActive(style_token_id);
    }
    return
      styleSettings[style_token_id].cap -
      styleSettings[style_token_id].mintedOfStyle -
      reservedTokens(style_token_id);
  }

  function verifyAllowlistEntryProof(
    uint32 style_token_id,
    bytes32[] memory allowlistProof,
    address requestor
  ) public view returns (bool) {
    return
      MerkleProofUpgradeable.verify(
        allowlistProof,
        allowlists[style_token_id].merkleRoot,
        //or maybe: https://ethereum.stackexchange.com/questions/884/how-to-convert-an-address-to-bytes-in-solidity/41356
        keccak256(abi.encodePacked(requestor))
      );
  }

  function decreaseAllowance(uint32 style_token_id, address requestor)
    public
    nonReentrant
    onlySplice
  {
    // CHECKS
    if (
      mintsAlreadyAllowed[style_token_id][requestor] + 1 >
      allowlists[style_token_id].mintsPerAddress
    ) {
      revert PersonalReservationLimitExceeded(style_token_id);
    }

    if (allowlists[style_token_id].numReserved < 1) {
      revert NotEnoughTokensToMatchReservation(style_token_id);
    }
    // INTERACTIONS
    allowlists[style_token_id].numReserved -= 1;
    mintsAlreadyAllowed[style_token_id][requestor] =
      mintsAlreadyAllowed[style_token_id][requestor] +
      1;
  }

  function addAllowlist(
    uint32 style_token_id,
    uint32 _numReserved,
    uint8 _mintsPerAddress,
    bytes32 _merkleRoot,
    uint64 _reservedUntil
  ) external {
    //CHECKS
    if (ownerOf(style_token_id) != msg.sender) {
      revert NotControllingStyle(style_token_id);
    }

    if (allowlists[style_token_id].reservedUntil != 0) {
      revert AllowlistNotOverridable(style_token_id);
    }

    uint32 stillAvailable = mintsLeft(style_token_id);
    if (
      _numReserved > stillAvailable || _mintsPerAddress > stillAvailable //that 2nd edge case is actually not important (minting would fail anyway when cap is exceeded)
    ) {
      revert BadReservationParameters(_numReserved, stillAvailable);
    }

    if (_reservedUntil < block.timestamp + 1 days) {
      revert AllowlistDurationTooShort(_reservedUntil);
    }

    //INTERACTION
    allowlists[style_token_id] = Allowlist({
      numReserved: _numReserved,
      merkleRoot: _merkleRoot,
      reservedUntil: _reservedUntil,
      mintsPerAddress: _mintsPerAddress
    });
    emit AllowlistInstalled(
      style_token_id,
      _numReserved,
      _mintsPerAddress,
      _reservedUntil
    );
  }

  function canBeMintedOnCollection(uint32 style_token_id, address collection)
    public
    view
    returns (bool)
  {
    if (!isSaleActive(style_token_id)) {
      revert SaleNotActive(style_token_id);
    }

    if (styleSettings[style_token_id].collectionConstrained) {
      return collectionAllowed[style_token_id][collection];
    } else {
      return true;
    }
  }

  function restrictToCollections(
    uint32 style_token_id,
    address[] memory _collections
  ) public {
    if (ownerOf(style_token_id) != msg.sender) {
      revert NotControllingStyle(style_token_id);
    }
    styleSettings[style_token_id].collectionConstrained = true;
    for (uint256 i = 0; i < _collections.length; i++) {
      collectionAllowed[style_token_id][_collections[i]] = true;
    }
  }

  function isFrozen(uint32 style_token_id) public view returns (bool) {
    return styleSettings[style_token_id].isFrozen;
  }

  function freeze(uint32 style_token_id, string memory cid)
    public
    onlyStyleMinter
  {
    if (bytes(cid).length < 46) {
      revert InvalidCID();
    }

    if (mintsLeft(style_token_id) != 0) {
      revert CantFreezeAnUncompleteCollection(mintsLeft(style_token_id));
    }

    styleSettings[style_token_id].salesIsActive = false;
    styleSettings[style_token_id].styleCID = cid;
    styleSettings[style_token_id].isFrozen = true;
    emit PermanentURI(tokenURI(style_token_id), style_token_id);
  }

  function incrementMintedPerStyle(uint32 style_token_id)
    external
    onlySplice
    returns (uint32)
  {
    if (!isSaleActive(style_token_id)) {
      revert SaleNotActive(style_token_id);
    }

    if (mintsLeft(style_token_id) == 0) {
      revert StyleIsFullyMinted();
    }
    styleSettings[style_token_id].mintedOfStyle += 1;
    return styleSettings[style_token_id].mintedOfStyle;
  }

  function mint(
    uint32 _cap,
    string memory _metadataCID,
    ISplicePriceStrategy _priceStrategy,
    bytes32 _priceStrategyParameters,
    bool _salesIsActive
  ) external onlyStyleMinter returns (uint32 style_token_id) {
    //CHECKS
    if (bytes(_metadataCID).length < 46) {
      revert InvalidCID();
    }

    //EFFECTS
    _styleTokenIds.increment();
    style_token_id = _styleTokenIds.current().toUint32();

    styleSettings[style_token_id] = StyleSettings({
      cap: _cap,
      styleCID: _metadataCID,
      priceStrategy: _priceStrategy,
      priceParameters: _priceStrategyParameters,
      mintedOfStyle: 0,
      salesIsActive: _salesIsActive,
      collectionConstrained: false,
      isFrozen: false
    });

    //INTERACTIONS
    _safeMint(msg.sender, style_token_id);
    emit Minted(style_token_id, _cap, _metadataCID);
  }
}
