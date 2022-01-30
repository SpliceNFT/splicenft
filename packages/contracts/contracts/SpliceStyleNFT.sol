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
  error AllowlistNotOverridable(uint32 styleTokenId);

  /// @notice someone wanted to modify the style NFT without owning it.
  error NotControllingStyle(uint32 styleTokenId);

  /// @notice The style cap has been reached. You can't mint more items using that style
  error StyleIsFullyMinted();

  /// @notice Sales is not active on the style
  error SaleNotActive(uint32 styleTokenId);

  /// @notice Reservation limit exceeded
  error PersonalReservationLimitExceeded(uint32 styleTokenId);

  /// @notice
  error NotEnoughTokensToMatchReservation(uint32 styleTokenId);

  /// @notice
  error StyleIsFrozen();

  error OriginNotAllowed(string reason);

  error BadMintInput(string reason);

  error CantFreezeAnUncompleteCollection(uint32 mintsLeft);

  error InvalidCID();

  //https://docs.opensea.io/docs/metadata-standards#ipfs-and-arweave-uris
  event PermanentURI(string _value, uint256 indexed _id);
  event Minted(uint32 indexed styleTokenId, uint32 cap, string metadataCID);
  event SharesChanged(uint16 percentage);
  event AllowlistInstalled(
    uint32 indexed styleTokenId,
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

  /**
   * @dev styleTokenId => Partnership
   */
  mapping(uint32 => Partnership) private _partnerships;

  uint16 public ARTIST_SHARE;

  Splice public spliceNFT;

  PaymentSplitterController public paymentSplitterController;

  function initialize() public initializer {
    __ERC721_init('Splice Style NFT', 'SPLYLE');
    __ERC721Enumerable_init_unchained();
    __Ownable_init_unchained();
    __ReentrancyGuard_init();
    ARTIST_SHARE = 8500;
  }

  modifier onlyStyleMinter() {
    require(isStyleMinter[msg.sender], 'not allowed to mint styles');
    _;
  }

  modifier onlySplice() {
    require(msg.sender == address(spliceNFT), 'only callable by Splice');
    _;
  }

  modifier controlsStyle(uint32 styleTokenId) {
    if (!isStyleMinter[msg.sender] && msg.sender != ownerOf(styleTokenId)) {
      revert NotControllingStyle(styleTokenId);
    }
    _;
  }

  function updateArtistShare(uint16 share) public onlyOwner {
    require(share <= 10000 && share > 7500, 'we will never take more than 25%');
    ARTIST_SHARE = share;
    emit SharesChanged(share);
  }

  function setPaymentSplitter(PaymentSplitterController ps) external onlyOwner {
    if (address(paymentSplitterController) != address(0)) {
      revert('can only be called once.');
    }
    paymentSplitterController = ps;
  }

  function setSplice(Splice _spliceNFT) external onlyOwner {
    if (address(spliceNFT) != address(0)) {
      revert('can only be called once.');
    }
    spliceNFT = _spliceNFT;
  }

  function toggleStyleMinter(address minter, bool newValue) external onlyOwner {
    isStyleMinter[minter] = newValue;
  }

  function getPartnership(uint32 styleTokenId)
    public
    view
    returns (
      address[] memory collections,
      uint256 until,
      bool exclusive
    )
  {
    Partnership memory p = _partnerships[styleTokenId];
    return (p.collections, p.until, p.exclusive);
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
    uint32 styleTokenId,
    IERC721[] memory originCollections,
    uint256[] memory originTokenIds
  ) public view returns (uint256 fee) {
    fee = styleSettings[styleTokenId].priceStrategy.quote(
      styleTokenId,
      originCollections,
      originTokenIds
    );
  }

  function getSettings(uint32 styleTokenId)
    public
    view
    returns (StyleSettings memory)
  {
    return styleSettings[styleTokenId];
  }

  function isSaleActive(uint32 styleTokenId) public view returns (bool) {
    return styleSettings[styleTokenId].salesIsActive;
  }

  function toggleSaleIsActive(uint32 styleTokenId, bool newValue)
    external
    controlsStyle(styleTokenId)
  {
    if (isFrozen(styleTokenId)) {
      revert StyleIsFrozen();
    }
    styleSettings[styleTokenId].salesIsActive = newValue;
  }

  /**
   * @return how many mints are left on that style
   */
  function mintsLeft(uint32 styleTokenId) public view returns (uint32) {
    return
      styleSettings[styleTokenId].cap -
      styleSettings[styleTokenId].mintedOfStyle;
  }

  /**
   * @return how many mints are currently reserved on the allowlist
   */
  function reservedTokens(uint32 styleTokenId) public view returns (uint32) {
    if (block.timestamp > allowlists[styleTokenId].reservedUntil) {
      //reservation period has ended
      return 0;
    }
    return allowlists[styleTokenId].numReserved;
  }

  /**
   * @return how many splices can be minted except those reserved on an allowlist for that style
   */
  function availableForPublicMinting(uint32 styleTokenId)
    public
    view
    returns (uint32)
  {
    return
      styleSettings[styleTokenId].cap -
      styleSettings[styleTokenId].mintedOfStyle -
      reservedTokens(styleTokenId);
  }

  /**
   * @param allowlistProof a list of leaves in the merkle tree that are needed to perform the proof
   * @param requestor the subject account of the proof
   * @return whether the proof could be verified
   */

  function verifyAllowlistEntryProof(
    uint32 styleTokenId,
    bytes32[] memory allowlistProof,
    address requestor
  ) external view returns (bool) {
    return
      MerkleProofUpgradeable.verify(
        allowlistProof,
        allowlists[styleTokenId].merkleRoot,
        //or maybe: https://ethereum.stackexchange.com/questions/884/how-to-convert-an-address-to-bytes-in-solidity/41356
        keccak256(abi.encodePacked(requestor))
      );
  }

  /**
   * @dev called by Splice to decrement the allowance for requestor
   */
  function decreaseAllowance(uint32 styleTokenId, address requestor)
    external
    nonReentrant
    onlySplice
  {
    // CHECKS
    if (
      mintsAlreadyAllowed[styleTokenId][requestor] + 1 >
      allowlists[styleTokenId].mintsPerAddress
    ) {
      revert PersonalReservationLimitExceeded(styleTokenId);
    }

    if (allowlists[styleTokenId].numReserved < 1) {
      revert NotEnoughTokensToMatchReservation(styleTokenId);
    }
    // EFFECTS
    allowlists[styleTokenId].numReserved -= 1;
    mintsAlreadyAllowed[styleTokenId][requestor] += 1;
  }

  /**
   * @notice an allowlist gives privilege to a dedicated list of users to mint this style by presenting a merkle proof
     @param styleTokenId the style token id
   * @param numReserved_ how many reservations shall be made
   * @param mintsPerAddress_ how many mints are allowed per one distinct address
   * @param merkleRoot_ the merkle root of a tree of allowed addresses
   * @param reservedUntil_ a timestamp until when the allowlist shall be in effect
   */
  function addAllowlist(
    uint32 styleTokenId,
    uint32 numReserved_,
    uint8 mintsPerAddress_,
    bytes32 merkleRoot_,
    uint64 reservedUntil_
  ) external controlsStyle(styleTokenId) {
    //CHECKS
    if (allowlists[styleTokenId].reservedUntil != 0) {
      revert AllowlistNotOverridable(styleTokenId);
    }

    uint32 stillAvailable = mintsLeft(styleTokenId);
    if (
      numReserved_ > stillAvailable || mintsPerAddress_ > stillAvailable //that 2nd edge case is actually not important (minting would fail anyway when cap is exceeded)
    ) {
      revert BadReservationParameters(numReserved_, stillAvailable);
    }

    if (reservedUntil_ < block.timestamp + 1 days) {
      revert AllowlistDurationTooShort(reservedUntil_);
    }

    //EFFECTS
    allowlists[styleTokenId] = Allowlist({
      numReserved: numReserved_,
      merkleRoot: merkleRoot_,
      reservedUntil: reservedUntil_,
      mintsPerAddress: mintsPerAddress_
    });
    emit AllowlistInstalled(
      styleTokenId,
      numReserved_,
      mintsPerAddress_,
      reservedUntil_
    );
  }

  /**
   * @dev will revert when something prevents minting a splice
   */
  function isMintable(
    uint32 styleTokenId,
    IERC721[] memory originCollections,
    uint256[] memory originTokenIds,
    address minter
  ) public view returns (bool) {
    if (!isSaleActive(styleTokenId)) {
      revert SaleNotActive(styleTokenId);
    }

    if (
      originCollections.length == 0 ||
      originTokenIds.length == 0 ||
      originCollections.length != originTokenIds.length
    ) {
      revert BadMintInput('inconsistent input lengths');
    }

    if (styleSettings[styleTokenId].maxInputs < originCollections.length) {
      revert OriginNotAllowed('too many inputs');
    }

    Partnership memory partnership = _partnerships[styleTokenId];
    bool partnershipIsActive = (partnership.collections.length > 0 &&
      partnership.until > block.timestamp);
    uint8 partner_count = 0;
    for (uint256 i = 0; i < originCollections.length; i++) {
      if (i > 0) {
        if (
          address(originCollections[i]) <= address(originCollections[i - 1])
        ) {
          revert BadMintInput('duplicate or unordered origin input');
        }
      }
      if (partnershipIsActive) {
        if (
          ArrayLib.contains(
            partnership.collections,
            address(originCollections[i])
          )
        ) {
          partner_count++;
        }
      }
    }

    if (partnershipIsActive) {
      //this saves a very slight amount of gas compared to &&
      if (partnership.exclusive) {
        if (partner_count != originCollections.length) {
          revert OriginNotAllowed('exclusive partnership');
        }
      }
    }

    return true;
  }

  function isFrozen(uint32 styleTokenId) public view returns (bool) {
    return styleSettings[styleTokenId].isFrozen;
  }

  /**
   * @notice freezing a fully minted style means to disable its sale and set its splice's baseUrl to a fixed IPFS CID. That IPFS directory must contain all metadata for the splices.
   * @param cid an IPFS content hash
   */
  function freeze(uint32 styleTokenId, string memory cid)
    public
    onlyStyleMinter
  {
    if (bytes(cid).length < 46) {
      revert InvalidCID();
    }

    //@todo: this might be unnecessarily strict
    if (mintsLeft(styleTokenId) != 0) {
      revert CantFreezeAnUncompleteCollection(mintsLeft(styleTokenId));
    }

    styleSettings[styleTokenId].salesIsActive = false;
    styleSettings[styleTokenId].styleCID = cid;
    styleSettings[styleTokenId].isFrozen = true;
    emit PermanentURI(tokenURI(styleTokenId), styleTokenId);
  }

  /**
   * @dev only called by Splice. Increments the amount of minted splices.
   * @return the new highest amount. Used as incremental part of the splice token id
   */
  function incrementMintedPerStyle(uint32 styleTokenId)
    public
    onlySplice
    returns (uint32)
  {
    if (!isSaleActive(styleTokenId)) {
      revert SaleNotActive(styleTokenId);
    }

    if (mintsLeft(styleTokenId) == 0) {
      revert StyleIsFullyMinted();
    }
    styleSettings[styleTokenId].mintedOfStyle += 1;
    styleSettings[styleTokenId].priceStrategy.onMinted(styleTokenId);
    return styleSettings[styleTokenId].mintedOfStyle;
  }

  /**
   * @notice collection partnerships have an effect on minting availability. They restrict styles to be minted only on certain collections. Partner collections receive a share of the platform fee.
   * @param until after this timestamp the partnership is not in effect anymore. Set to a very high value to add a collection constraint to a style.
   * @param exclusive a non-exclusive partnership allows other origins to mint. When trying to mint on an exclusive partnership with an unsupported input, it will fail.
   */
  function enablePartnership(
    address[] memory collections,
    uint32 styleTokenId,
    uint64 until,
    bool exclusive
  ) external onlyStyleMinter {
    require(
      styleSettings[styleTokenId].mintedOfStyle == 0,
      'cant add a partnership after minting started'
    );

    _partnerships[styleTokenId] = Partnership({
      collections: collections,
      until: until,
      exclusive: exclusive
    });
  }

  function setupPaymentSplitter(
    uint256 styleTokenId,
    address artist,
    address partner
  ) internal returns (address ps) {
    address[] memory members;
    uint256[] memory shares;

    if (partner != address(0)) {
      members = new address[](3);
      shares = new uint256[](3);
      uint256 splitShare = (10_000 - ARTIST_SHARE) / 2;

      members[0] = artist;
      shares[0] = ARTIST_SHARE;
      members[1] = spliceNFT.platformBeneficiary();
      shares[1] = splitShare;
      members[2] = partner;
      shares[2] = splitShare;
    } else {
      members = new address[](2);
      shares = new uint256[](2);
      members[0] = artist;
      shares[0] = ARTIST_SHARE;
      members[1] = spliceNFT.platformBeneficiary();
      shares[1] = 10_000 - ARTIST_SHARE;
    }

    ps = paymentSplitterController.createSplit(styleTokenId, members, shares);
  }

  /**
   * @notice creates a new style NFT
   * @param cap_ how many splices can be minted of this style
   * @param metadataCID_ an IPFS CID pointing to the style metadata. Must be a directory, containing a metadata.json file.
   * @param priceStrategy_ address of an ISplicePriceStrategy instance that's configured to return fee quotes for the new style (e.g. static)
   * @param salesIsActive_ splices of this style can be minted once this method is finished (careful: some other methods will only run when no splices have ever been minted)
   * @param maxInputs_ how many origin inputs are allowed for a mint (e.g. 2 NFT collections)
   * @param artist_ the first owner of that style. If 0 the minter is the first owner.
   * @param partnershipBeneficiary_ an address that gets 50% of platform shares. Can be 0
   */
  function mint(
    uint32 cap_,
    string memory metadataCID_,
    ISplicePriceStrategy priceStrategy_,
    bool salesIsActive_,
    uint8 maxInputs_,
    address artist_,
    address partnershipBeneficiary_
  ) external onlyStyleMinter returns (uint32 styleTokenId) {
    //CHECKS
    if (bytes(metadataCID_).length < 46) {
      revert InvalidCID();
    }

    if (artist_ == address(0)) {
      artist_ = msg.sender;
    }
    //EFFECTS
    _styleTokenIds.increment();
    styleTokenId = _styleTokenIds.current().toUint32();

    styleSettings[styleTokenId] = StyleSettings({
      mintedOfStyle: 0,
      cap: cap_,
      priceStrategy: priceStrategy_,
      salesIsActive: salesIsActive_,
      isFrozen: false,
      styleCID: metadataCID_,
      maxInputs: maxInputs_,
      paymentSplitter: setupPaymentSplitter(
        styleTokenId,
        artist_,
        partnershipBeneficiary_
      )
    });

    //INTERACTIONS
    _safeMint(artist_, styleTokenId);
    emit Minted(styleTokenId, cap_, metadataCID_);
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
