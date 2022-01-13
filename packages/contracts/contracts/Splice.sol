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
import '@openzeppelin/contracts-upgradeable/utils/escrow/EscrowUpgradeable.sol';
import 'hardhat/console.sol';

import './BytesLib.sol';
import './ArrayLib.sol';
import './Structs.sol';
import './SpliceStyleNFT.sol';

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

  /// @notice you didn't send sufficient fees along
  error InsufficientFees();

  /// @notice The combination of origin and style already has been minted
  error ProvenanceAlreadyUsed();

  /// @notice That token hasn't been minted (yet)
  error SpliceNotFound();

  /// @notice only reserved mints are left or not on allowlist
  error NotAllowedToMint(string reason);

  uint8 public ARTIST_SHARE;
  uint8 public ROYALTY_PERCENT;

  string private baseUri;

  //lookup table
  //keccak(0xcollection + origin_token_id + style_token_id)  => token_id
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
  address payable public platformBeneficiary;

  /**
   * @dev an Escrow that keeps funds safe
   * @dev check: https://medium.com/[at]ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
   */
  EscrowUpgradeable private feesEscrow;

  event SharesChanged(uint8 percentage);
  event Withdrawn(address indexed user, uint256 amount);
  event Minted(
    bytes32 indexed origin_hash,
    uint64 indexed token_id,
    uint32 indexed style_token_id
  );

  function initialize(
    string memory baseUri_,
    SpliceStyleNFT initializedStyleNFT_
  ) public initializer {
    __ERC721_init('Splice', 'SPLICE');
    __Ownable_init();
    __Pausable_init();
    __ReentrancyGuard_init();
    ARTIST_SHARE = 85;
    ROYALTY_PERCENT = 10;
    platformBeneficiary = payable(msg.sender);
    feesEscrow = new EscrowUpgradeable();
    feesEscrow.initialize();
    baseUri = baseUri_;
    styleNFT = initializedStyleNFT_;
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
    platformBeneficiary.transfer(address(this).balance);
  }

  function withdrawERC20(IERC20 token) external onlyOwner {
    token.transfer(platformBeneficiary, token.balanceOf(address(this)));
  }

  function withdrawERC721(IERC721 nftContract, uint256 tokenId)
    external
    onlyOwner
  {
    nftContract.transferFrom(address(this), platformBeneficiary, tokenId);
  }

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }

  function styleAndTokenByTokenId(uint256 tokenId)
    public
    pure
    returns (uint32 style_token_id, uint32 token_token_id)
  {
    bytes memory tokenIdBytes = abi.encode(tokenId);

    style_token_id = BytesLib.toUint32(tokenIdBytes, 24);
    token_token_id = BytesLib.toUint32(tokenIdBytes, 28);
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

    (uint32 style_token_id, uint32 token_token_id) = styleAndTokenByTokenId(
      tokenId
    );
    //todo: our custom int -> string can be replaced with ozs String.sol
    if (styleNFT.isFrozen(style_token_id)) {
      StyleSettings memory settings = styleNFT.getSettings(style_token_id);
      return
        string(
          abi.encodePacked(
            'ipfs://',
            settings.styleCID,
            '/',
            BytesLib.uintToString(token_token_id)
          )
        );
    } else {
      return super.tokenURI(tokenId);
    }
  }

  function updateArtistShare(uint8 share) external onlyOwner {
    require(share > 75, 'we will never take more than 25%');
    ARTIST_SHARE = share;
    emit SharesChanged(share);
  }

  function updateRoyalties(uint8 royaltyPercentage) external onlyOwner {
    require(royaltyPercentage <= 10, 'royalties must never exceed 10%');
    ROYALTY_PERCENT = royaltyPercentage;
  }

  // https://eips.ethereum.org/EIPS/eip-2981
  // https://docs.openzeppelin.com/contracts/4.x/api/interfaces#IERC2981
  // https://forum.openzeppelin.com/t/how-do-eip-2891-royalties-work/17177
  function royaltyInfo(uint256 tokenId, uint256 salePrice)
    public
    view
    returns (address receiver, uint256 royaltyAmount)
  {
    (uint32 style_token_id, ) = styleAndTokenByTokenId(tokenId);
    receiver = styleNFT.ownerOf(style_token_id);
    royaltyAmount = ROYALTY_PERCENT * salePrice.div(100);
  }

  function quote(
    uint32 style_token_id,
    IERC721[] memory nfts,
    uint256[] memory origin_token_ids
  ) external view returns (uint256 fee) {
    return styleNFT.quoteFee(style_token_id, nfts, origin_token_ids);
  }

  //https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
  function claimShares(address payable beneficiary)
    public
    nonReentrant
    whenNotPaused
  {
    uint256 balance = escrowedBalanceOf(beneficiary);
    feesEscrow.withdraw(beneficiary);
    emit Withdrawn(msg.sender, balance);
  }

  function escrowedBalanceOf(address payee) public view returns (uint256) {
    return feesEscrow.depositsOf(payee);
  }

  function splitMintFee(
    uint256 amount,
    uint32 styleTokenId,
    IERC721[] memory origin_collections,
    uint256[] memory origin_token_ids
  ) internal {
    uint256 feeForArtist = ARTIST_SHARE * amount.div(100);
    uint256 feeForPlatform = amount.sub(feeForArtist);

    Partnership memory partnership = styleNFT.getPartnership(styleTokenId);
    uint8 partner_count = 0;
    bool partnership_is_active = (partnership.collections.length > 0 &&
      partnership.until > block.timestamp);
    for (uint256 i = 0; i < origin_collections.length; i++) {
      if (origin_collections[i].ownerOf(origin_token_ids[i]) != msg.sender) {
        revert NotAllowedToMint('not owning origin');
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
          revert NotAllowedToMint(
            'collections not part of exclusive partnership'
          );
        }
      }
    }

    if (partner_count > 0) {
      uint256 feeForPartners = feeForPlatform.div(2);
      feeForPlatform = feeForPartners;
      feesEscrow.deposit{ value: feeForPartners }(partnership.beneficiary);
    }

    feesEscrow.deposit{ value: feeForArtist }(styleNFT.ownerOf(styleTokenId));
    feesEscrow.deposit{ value: feeForPlatform }(platformBeneficiary);
  }

  function mint(
    IERC721[] memory origin_collections,
    uint256[] memory origin_token_ids,
    uint32 style_token_id,
    bytes32[] memory allowlistProof,
    bytes calldata input_params
  ) external payable whenNotPaused returns (uint64 token_id) {
    //CHECKS
    require(
      styleNFT.isMintable(
        style_token_id,
        origin_collections,
        origin_token_ids,
        msg.sender
      )
    );

    if (styleNFT.availableForPublicMinting(style_token_id) == 0) {
      if (
        allowlistProof.length == 0 ||
        !styleNFT.verifyAllowlistEntryProof(
          style_token_id,
          allowlistProof,
          msg.sender
        )
      ) {
        revert NotAllowedToMint('no reservations left or proof failed');
      } else {
        styleNFT.decreaseAllowance(style_token_id, msg.sender);
      }
    }

    uint256 fee = styleNFT.quoteFee(
      style_token_id,
      origin_collections,
      origin_token_ids
    );
    if (msg.value < fee) revert InsufficientFees();

    bytes32 _provenanceHash = keccak256(
      abi.encodePacked(origin_collections, origin_token_ids, style_token_id)
    );

    if (provenanceToTokenId[_provenanceHash] != 0x0) {
      revert ProvenanceAlreadyUsed();
    }

    //EFFECTS
    splitMintFee(fee, style_token_id, origin_collections, origin_token_ids);

    uint32 nextStyleMintId = styleNFT.incrementMintedPerStyle(style_token_id);
    token_id = BytesLib.toUint64(
      abi.encodePacked(style_token_id, nextStyleMintId),
      0
    );
    provenanceToTokenId[_provenanceHash] = token_id;

    //INTERACTIONS
    _safeMint(msg.sender, token_id);

    //if someone sent too much, we're sending it back to them
    uint256 surplus = msg.value.sub(fee);

    if (surplus > 0) {
      payable(msg.sender).sendValue(surplus);
    }

    emit Minted(
      keccak256(abi.encode(origin_collections, origin_token_ids)),
      token_id,
      style_token_id
    );
    return token_id;
  }
}
