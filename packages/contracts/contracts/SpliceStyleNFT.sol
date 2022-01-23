// contracts/SpliceStyleNFT.sol
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
import './Splice.sol';
import './Structs.sol';
import './ArrayLib.sol';
import './ReplaceablePaymentSplitter.sol';
import './PaymentSplitterController.sol';

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

  error NotOwningOrigin();

  error OriginNotAllowed(string reason);

  error BadMintInput(string reason);

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
  // @dev unused
  mapping(uint32 => mapping(address => bool)) collectionAllowed;

  Splice public spliceNFT;

  /**
   * @dev style_token_id => Partnership
   */
  mapping(uint32 => Partnership) private _partnerships;

  PaymentSplitterController public paymentSplitterController;

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
    require(msg.sender == address(spliceNFT), 'only callable by Splice');
    _;
  }

  modifier onlyStyleOwner(uint32 style_token_id) {
    if (ownerOf(style_token_id) != msg.sender) {
      revert NotControllingStyle(style_token_id);
    }
    _;
  }

  function setPaymentSplitter(PaymentSplitterController ps_)
    external
    onlyOwner
  {
    if (address(paymentSplitterController) != address(0)) {
      revert('can only be called once.');
    }
    paymentSplitterController = ps_;
  }

  function setSplice(Splice _spliceNFT) external onlyOwner {
    if (address(spliceNFT) != address(0)) {
      revert('can only be called once.');
    }
    spliceNFT = _spliceNFT;
  }

  function setRoyaltySplitterController(
    PaymentSplitterController _paymentSplitterController
  ) external onlyOwner {
    paymentSplitterController = _paymentSplitterController;
  }

  function toggleStyleMinter(address minter, bool newValue) external onlyOwner {
    isStyleMinter[minter] = newValue;
  }

  /**
   * @dev we assume that our metadata CIDs are folder roots containing a /metadata.json. That's how nft.storage does it.
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

  /**
   * todo if there's more than one mint request in one block the quoted fee might be lower
   * than what the artist expects, (when using a bonded price strategy)

   * @return fee the fee required to mint splices of that style
   */
  function quoteFee(
    uint32 style_token_id,
    IERC721[] memory nfts,
    uint256[] memory origin_token_ids
  ) public view returns (uint256 fee) {
    fee = styleSettings[style_token_id].priceStrategy.quote(
      style_token_id,
      nfts,
      origin_token_ids
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

  function toggleSaleIsActive(uint32 style_token_id, bool newValue)
    external
    onlyStyleOwner(style_token_id)
  {
    if (isFrozen(style_token_id)) {
      revert StyleIsFrozen();
    }
    styleSettings[style_token_id].salesIsActive = newValue;
  }

  /**
   * @return how many mints are left on that style
   */
  function mintsLeft(uint32 style_token_id) public view returns (uint32) {
    return
      styleSettings[style_token_id].cap -
      styleSettings[style_token_id].mintedOfStyle;
  }

  /**
   * @return how many mints are currently reserved on the allowlist
   */
  function reservedTokens(uint32 style_token_id) public view returns (uint32) {
    if (block.timestamp > allowlists[style_token_id].reservedUntil) {
      //reservation period has ended
      return 0;
    }
    return allowlists[style_token_id].numReserved;
  }

  /**
   * @return how many splices can be minted except those reserved on an allowlist for that style
   */
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

  /**
   * @param allowlistProof a list of leaves in the merkle tree that are needed to perform the proof
   * @param requestor the subject account of the proof
   * @return whether the proof could be verified
   */

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

  /**
   * @dev called by Splice to decrement the allowance for requestor
   */
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
    // EFFECTS
    allowlists[style_token_id].numReserved -= 1;
    mintsAlreadyAllowed[style_token_id][requestor] =
      mintsAlreadyAllowed[style_token_id][requestor] +
      1;
  }

  /**
   * @notice an allowlist gives privilege to a dedicated list of users to mint this style by presenting a merkle proof
   * @param _numReserved how many reservations shall be made
   * @param _mintsPerAddress how many mints are allowed per one distinct address
   * @param _merkleRoot the merkle root of a tree of allowed addresses
   * @param _reservedUntil a timestamp until when the allowlist shall be in effect
   */
  function addAllowlist(
    uint32 style_token_id,
    uint32 _numReserved,
    uint8 _mintsPerAddress,
    bytes32 _merkleRoot,
    uint64 _reservedUntil
  ) external onlyStyleOwner(style_token_id) {
    //CHECKS
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

    //EFFECTS
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

  /**
   * @dev will revert when something prevents minting a splice
   */
  function isMintable(
    uint32 style_token_id,
    IERC721[] memory origin_collections,
    uint256[] memory origin_token_ids,
    address minter
  ) public view returns (bool) {
    if (!isSaleActive(style_token_id)) {
      revert SaleNotActive(style_token_id);
    }

    if (
      origin_collections.length == 0 ||
      origin_token_ids.length == 0 ||
      origin_collections.length != origin_token_ids.length
    ) {
      revert BadMintInput('inconsistent input lengths');
    }

    if (styleSettings[style_token_id].maxInputs < origin_collections.length) {
      revert OriginNotAllowed('too many inputs');
    }

    Partnership memory partnership = _partnerships[style_token_id];
    bool partnership_is_active = (partnership.collections.length > 0 &&
      partnership.until > block.timestamp);
    uint8 partner_count = 0;
    for (uint256 i = 0; i < origin_collections.length; i++) {
      if (origin_collections[i].ownerOf(origin_token_ids[i]) != minter) {
        revert NotOwningOrigin();
      }
      if (partnership_is_active) {
        if (
          ArrayLib.contains(
            partnership.collections,
            address(origin_collections[i])
          )
        ) {
          partner_count++;
        }
      }
    }
    if (partnership_is_active) {
      //this saves a very slight amount of gas compared to &&
      if (partnership.exclusive) {
        if (partner_count != origin_collections.length) {
          revert OriginNotAllowed('exclusive partnership');
        }
      }
    }

    return true;
  }

  /**
   * @notice collection partnerships have an effect on minting availability. They restrict styles to be minted only on certain collections. Partner collections receive a share of the platform fee.
   * @param beneficiary account of the partner collection that we escrow shares to
   * @param until after this timestamp the partnership is not in effect anymore. Set to a very high value to add a collection constraint to a style.
   * @param exclusive a non-exclusive partnership allows other origins to mint. When trying to mint on an exclusive partnership with an unsupported input, it will fail.
   */
  function addCollectionPartnership(
    address[] memory collections,
    uint32 style_token_id,
    address beneficiary,
    uint64 until,
    bool exclusive
  ) external onlyStyleMinter {
    //todo: consider loosening this restriction for non exclusive partnerships
    if (styleSettings[style_token_id].mintedOfStyle > 0) {
      revert('cant add a partnership after minting started');
    }

    _partnerships[style_token_id] = Partnership({
      collections: collections,
      beneficiary: beneficiary,
      until: until,
      exclusive: exclusive
    });

    address[] memory members = new address[](3);
    members[0] = address(ownerOf(style_token_id));
    members[1] = spliceNFT.platformBeneficiary();
    members[2] = beneficiary;

    uint256 artistShare = spliceNFT.ARTIST_SHARE();
    uint256 splitShare = (100 - artistShare) / 2;

    uint256[] memory shares = new uint256[](3);
    shares[0] = artistShare;
    shares[1] = splitShare;
    shares[2] = splitShare;

    styleSettings[style_token_id].paymentSplitter = paymentSplitterController
      .createSplit(style_token_id, members, shares);
  }

  function isFrozen(uint32 style_token_id) public view returns (bool) {
    return styleSettings[style_token_id].isFrozen;
  }

  /**
   * @notice freezing a fully minted style means to disable its sale and set its splice's baseUrl to a fixed IPFS CID. That IPFS directory must contain all metadata for the splices.
   * @param cid an IPFS content hash
   */
  function freeze(uint32 style_token_id, string memory cid)
    public
    onlyStyleMinter
  {
    if (bytes(cid).length < 46) {
      revert InvalidCID();
    }

    //@todo: this might be unnecessarily strict
    if (mintsLeft(style_token_id) != 0) {
      revert CantFreezeAnUncompleteCollection(mintsLeft(style_token_id));
    }

    styleSettings[style_token_id].salesIsActive = false;
    styleSettings[style_token_id].styleCID = cid;
    styleSettings[style_token_id].isFrozen = true;
    emit PermanentURI(tokenURI(style_token_id), style_token_id);
  }

  /**
   * @dev only called by Splice. Increments the amount of minted splices.
   * @return the new highest amount. Used as incremental part of the splice token id
   */
  function incrementMintedPerStyle(uint32 style_token_id)
    public
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
    styleSettings[style_token_id].priceStrategy.onMinted(style_token_id);
    return styleSettings[style_token_id].mintedOfStyle;
  }

  /**
   * //todo: consider adding the first owner as parameter and mint it to him.
   *
   * @notice creates a new style NFT
   * @param _cap how many splices can be minted of this style
   * @param _metadataCID an IPFS CID pointing to the style metadata. Must be a directory, containing a metadata.json file.
   * @param _priceStrategy address of an ISplicePriceStrategy instance that's configured to return fee quotes for the new style (e.g. static)
   * @param _salesIsActive splices of this style can be minted once this method is finished (careful: some other methods will only run when no splices have ever been minted)
   * @param _maxInputs how many origin inputs are allowed for a mint (e.g. 2 NFT collections)
   */
  function mint(
    uint32 _cap,
    string memory _metadataCID,
    ISplicePriceStrategy _priceStrategy,
    bool _salesIsActive,
    uint8 _maxInputs
  ) external onlyStyleMinter returns (uint32 style_token_id) {
    //CHECKS
    if (bytes(_metadataCID).length < 46) {
      revert InvalidCID();
    }

    address[] memory royMembers = new address[](2);
    royMembers[0] = msg.sender;
    royMembers[1] = spliceNFT.platformBeneficiary();
    uint256 artistShare = spliceNFT.ARTIST_SHARE();

    uint256[] memory royShares = new uint256[](2);
    royShares[0] = artistShare;
    royShares[1] = 100 - artistShare;

    //EFFECTS
    _styleTokenIds.increment();
    style_token_id = _styleTokenIds.current().toUint32();

    styleSettings[style_token_id] = StyleSettings({
      mintedOfStyle: 0,
      cap: _cap,
      priceStrategy: _priceStrategy,
      salesIsActive: _salesIsActive,
      collectionConstrained: false,
      isFrozen: false,
      styleCID: _metadataCID,
      maxInputs: _maxInputs,
      paymentSplitter: paymentSplitterController.createSplit(
        style_token_id,
        royMembers,
        royShares
      )
    });

    //INTERACTIONS
    _safeMint(msg.sender, style_token_id);
    emit Minted(style_token_id, _cap, _metadataCID);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    super._beforeTokenTransfer(from, to, tokenId);
    if (from != address(0) && to != address(0)) {
      //its not a mint or a burn but a real transfer
      paymentSplitterController.replaceShareholder(tokenId, payable(from), to);
    }
  }
}
