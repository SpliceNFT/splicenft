// contracts/Splice.sol
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

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/interfaces/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';

import './BytesLib.sol';
import './ArrayLib.sol';
import './Structs.sol';
import './SpliceStyleNFT.sol';
import './ReplaceablePaymentSplitter.sol';

/// @title Splice is a protocol to mint NFTs out of origin NFTs
/// @author Stefan Adolf @elmariachi111

contract Splice is
  ERC721Upgradeable,
  OwnableUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable,
  IERC2981Upgradeable
{
  using SafeMathUpgradeable for uint256;
  using AddressUpgradeable for address payable;
  using StringsUpgradeable for uint32;

  /// @notice you didn't send sufficient fees along
  error InsufficientFees();

  /// @notice The combination of origin and style already has been minted
  error ProvenanceAlreadyUsed();

  /// @notice That token hasn't been minted (yet)
  error SpliceNotFound();

  /// @notice only reserved mints are left or not on allowlist
  error NotAllowedToMint(string reason);

  uint8 public ROYALTY_PERCENT;

  string private baseUri;

  //lookup table
  //keccak(0xcollection + origin_tokenId + styleTokenId)  => tokenId
  mapping(bytes32 => uint64) public provenanceToTokenId;

  /**
   * @notice the contract that manages all styles as NFTs.
   * Styles are owned by artists and manage fee quoting.
   * Style NFTs are transferrable (you can sell your style to others)
   */
  SpliceStyleNFT public styleNFT;

  /**
   * @notice the splice platform account, i.e. a Gnosis Safe / DAO Treasury etc.
   */
  address public platformBeneficiary;

  event Withdrawn(address indexed user, uint256 amount);
  event Minted(
    bytes32 indexed origin_hash,
    uint64 indexed tokenId,
    uint32 indexed styleTokenId
  );
  event RoyaltiesUpdated(uint8 royalties);

  function initialize(
    string memory baseUri_,
    SpliceStyleNFT initializedStyleNFT_
  ) public initializer {
    __ERC721_init('Splice', 'SPLICE');
    __Ownable_init();
    __Pausable_init();
    __ReentrancyGuard_init();
    ROYALTY_PERCENT = 10;
    platformBeneficiary = msg.sender;
    baseUri = baseUri_;
    styleNFT = initializedStyleNFT_;
  }

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }

  function setBaseUri(string memory newBaseUri) external onlyOwner {
    baseUri = newBaseUri;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseUri;
  }

  //todo: the platform benef. should be the only one to name a new beneficiary, not the owner.
  function setPlatformBeneficiary(address payable newAddress)
    external
    onlyOwner
  {
    require(address(0) != newAddress, 'must be a real address');
    platformBeneficiary = newAddress;
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721Upgradeable, IERC165Upgradeable)
    returns (bool)
  {
    return
      interfaceId == type(IERC2981Upgradeable).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  /**
   * in case anything drops ETH/ERC20/ERC721 on us accidentally,
   * this will help us withdraw it.
   */
  function withdrawEth() external onlyOwner {
    AddressUpgradeable.sendValue(
      payable(platformBeneficiary),
      address(this).balance
    );
  }

  function withdrawERC20(IERC20 token) external onlyOwner {
    bool result = token.transfer(
      platformBeneficiary,
      token.balanceOf(address(this))
    );
    if (!result) revert('the transfer failed');
  }

  function withdrawERC721(IERC721 nftContract, uint256 tokenId)
    external
    onlyOwner
  {
    nftContract.transferFrom(address(this), platformBeneficiary, tokenId);
  }

  function styleAndTokenByTokenId(uint256 tokenId)
    public
    pure
    returns (uint32 styleTokenId, uint32 token_tokenId)
  {
    bytes memory tokenIdBytes = abi.encode(tokenId);

    styleTokenId = BytesLib.toUint32(tokenIdBytes, 24);
    token_tokenId = BytesLib.toUint32(tokenIdBytes, 28);
  }

  // for OpenSea
  function contractURI() public pure returns (string memory) {
    return 'https://getsplice.io/contract-metadata';
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      'ERC721Metadata: URI query for nonexistent token'
    );

    (uint32 styleTokenId, uint32 token_tokenId) = styleAndTokenByTokenId(
      tokenId
    );
    //todo: our custom int -> string can be replaced with ozs String.sol
    if (styleNFT.isFrozen(styleTokenId)) {
      StyleSettings memory settings = styleNFT.getSettings(styleTokenId);
      return
        string(
          abi.encodePacked(
            'ipfs://',
            settings.styleCID,
            '/',
            token_tokenId.toString()
          )
        );
    } else {
      return super.tokenURI(tokenId);
    }
  }

  function quote(
    uint32 styleTokenId,
    IERC721[] memory nfts,
    uint256[] memory originTokenIds
  ) external view returns (uint256 fee) {
    return styleNFT.quoteFee(styleTokenId, nfts, originTokenIds);
  }

  /**
   * @notice this won't change royalties for everyone. It will only have effect for new styles
   */
  function updateRoyalties(uint8 royaltyPercentage) external onlyOwner {
    require(royaltyPercentage <= 10, 'royalties must never exceed 10%');
    ROYALTY_PERCENT = royaltyPercentage;
    emit RoyaltiesUpdated(royaltyPercentage);
  }

  // https://eips.ethereum.org/EIPS/eip-2981
  // https://docs.openzeppelin.com/contracts/4.x/api/interfaces#IERC2981
  // https://forum.openzeppelin.com/t/how-do-eip-2891-royalties-work/17177
  /**
   * potentially (hopefully) called by marketplaces to find a target address where to send royalties
   * @notice the returned address will be a payment splitting instance
   */
  function royaltyInfo(uint256 tokenId, uint256 salePrice)
    public
    view
    returns (address receiver, uint256 royaltyAmount)
  {
    (uint32 styleTokenId, ) = styleAndTokenByTokenId(tokenId);
    receiver = styleNFT.getSettings(styleTokenId).paymentSplitter;
    royaltyAmount = (ROYALTY_PERCENT * salePrice).div(100);
  }

  function mint(
    IERC721[] memory originCollections,
    uint256[] memory originTokenIds,
    uint32 styleTokenId,
    bytes32[] memory allowlistProof,
    bytes calldata inputParams
  ) external payable whenNotPaused nonReentrant returns (uint64 tokenId) {
    //CHECKS
    require(
      styleNFT.isMintable(
        styleTokenId,
        originCollections,
        originTokenIds,
        msg.sender
      )
    );

    if (styleNFT.availableForPublicMinting(styleTokenId) == 0) {
      if (
        allowlistProof.length == 0 ||
        !styleNFT.verifyAllowlistEntryProof(
          styleTokenId,
          allowlistProof,
          msg.sender
        )
      ) {
        revert NotAllowedToMint('no reservations left or proof failed');
      } else {
        styleNFT.decreaseAllowance(styleTokenId, msg.sender);
      }
    }

    uint256 fee = styleNFT.quoteFee(
      styleTokenId,
      originCollections,
      originTokenIds
    );
    if (msg.value < fee) revert InsufficientFees();

    bytes32 _provenanceHash = keccak256(
      abi.encodePacked(originCollections, originTokenIds, styleTokenId)
    );

    if (provenanceToTokenId[_provenanceHash] != 0x0) {
      revert ProvenanceAlreadyUsed();
    }

    //EFFECTS
    AddressUpgradeable.sendValue(
      payable(styleNFT.getSettings(styleTokenId).paymentSplitter),
      fee
    );

    uint32 nextStyleMintId = styleNFT.incrementMintedPerStyle(styleTokenId);
    tokenId = BytesLib.toUint64(
      abi.encodePacked(styleTokenId, nextStyleMintId),
      0
    );
    provenanceToTokenId[_provenanceHash] = tokenId;

    //INTERACTIONS
    _safeMint(msg.sender, tokenId);

    //if someone sent too much, we're sending it back to them
    uint256 surplus = msg.value.sub(fee);

    if (surplus > 0) {
      payable(msg.sender).sendValue(surplus);
    }

    emit Minted(
      keccak256(abi.encode(originCollections, originTokenIds)),
      tokenId,
      styleTokenId
    );
    return tokenId;
  }
}
