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

  /// @notice you're not owning the origin NFT
  error NotOwningOrigin();

  /// @notice The combination of origin and style already has been minted
  error ProvenanceAlreadyUsed();

  /// @notice That token hasn't been minted (yet)
  error SpliceNotFound();

  /// @notice only reserved mints are left or not on allowlist
  error NotAllowedToMint(string reason);

  ///
  error BadMintInput();

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

  function setBaseUri(string memory newBaseUri) public onlyOwner {
    baseUri = newBaseUri;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseUri;
  }

  //todo: the platform benef. should be the only one to name a new beneficiary, not the owner.
  function setPlatformBeneficiary(address payable newAddress) public onlyOwner {
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
  function withdrawEth() public onlyOwner {
    platformBeneficiary.transfer(address(this).balance);
  }

  function withdrawERC20(IERC20 token) public onlyOwner {
    token.transfer(platformBeneficiary, token.balanceOf(address(this)));
  }

  function withdrawERC721(IERC721 nftContract, uint256 tokenId)
    public
    onlyOwner
  {
    nftContract.transferFrom(address(this), platformBeneficiary, tokenId);
  }

  //todo: add more interfaces for royalties here.
  //https://eips.ethereum.org/EIPS/eip-2981
  // https://docs.openzeppelin.com/contracts/4.x/api/interfaces#IERC2981

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
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

  function updateArtistShare(uint8 share) public onlyOwner {
    require(share > 75, 'we will never take more than 25%');
    ARTIST_SHARE = share;
    emit SharesChanged(share);
  }

  function updateRoyalties(uint8 royaltyPercentage) public onlyOwner {
    require(royaltyPercentage <= 10, 'royalties must never exceed 10%');
    ROYALTY_PERCENT = royaltyPercentage;
  }

  // https://eips.ethereum.org/EIPS/eip-2981
  // https://docs.openzeppelin.com/contracts/4.x/api/interfaces#IERC2981
  // https://forum.openzeppelin.com/t/how-do-eip-2891-royalties-work/17177
  function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external
    view
    returns (address receiver, uint256 royaltyAmount)
  {
    (uint32 style_token_id, ) = styleAndTokenByTokenId(tokenId);
    receiver = styleNFT.ownerOf(style_token_id);
    royaltyAmount = ROYALTY_PERCENT * salePrice.div(100);
  }

  /// @dev the randomness is the first 32 bit of the provenance hash
  /// (0xcollection + origin_token_id + style_token_id)
  // function randomness(bytes32 _provenanceHash) public pure returns (uint32) {
  //   return BytesLib.toUint32(abi.encodePacked(_provenanceHash), 0);
  // }

  function quote(IERC721 nft, uint32 style_token_id)
    public
    view
    returns (uint256 fee)
  {
    return styleNFT.quoteFee(nft, style_token_id);
  }

  function splitMintFee(uint256 amount, uint32 style_token_id) internal {
    uint256 feeForArtist = ARTIST_SHARE * amount.div(100);
    uint256 feeForPlatform = amount.sub(feeForArtist); //Splice takes a 15% cut

    address beneficiaryArtist = styleNFT.ownerOf(style_token_id);
    //https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    feesEscrow.deposit{ value: feeForArtist }(beneficiaryArtist);
    feesEscrow.deposit{ value: feeForPlatform }(platformBeneficiary);
    //todo: later add a share to a beneficiary of the origin collection.
  }

  function claimShares(address payable beneficiary)
    external
    nonReentrant
    whenNotPaused
  {
    uint256 balance = escrowedBalanceOf(beneficiary);
    //todo: the payable cast might not be right (msg.sender might be a contract)
    feesEscrow.withdraw(beneficiary);
    emit Withdrawn(msg.sender, balance);
  }

  function escrowedBalanceOf(address payee) public view returns (uint256) {
    return feesEscrow.depositsOf(payee);
  }

  function mint(
    IERC721[] memory origin_collections,
    uint256[] memory origin_token_ids,
    uint32 style_token_id,
    bytes32[] memory allowlistProof,
    //stays in calldata and can be used to later prove aspects of the user facing inputs
    bytes calldata input_params
  ) public payable whenNotPaused nonReentrant returns (uint64 token_id) {
    //CHECKS
    if (
      origin_collections.length == 0 ||
      origin_token_ids.length == 0 ||
      origin_collections.length != origin_token_ids.length
    ) {
      revert BadMintInput();
    }

    for (uint256 i = 0; i < origin_collections.length; i++) {
      if (origin_collections[i].ownerOf(origin_token_ids[i]) != msg.sender) {
        revert NotOwningOrigin();
      }
      if (
        !styleNFT.canBeMintedOnCollection(
          style_token_id,
          address(origin_collections[i])
        )
      ) {
        revert NotAllowedToMint('style disallows minting on this collection');
      }
    }

    //todo if there's more than one mint request in one block the quoted fee might be lower
    //than what the artist expects, (when using a bonded price strategy)
    uint256 fee = quote(origin_collections[0], style_token_id);
    if (msg.value < fee) revert InsufficientFees();

    //if someone sent too much, we're sending it back to them
    uint256 surplus = msg.value.sub(fee);

    //CHECKS & EFFECTS
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

    bytes32 _provenanceHash = keccak256(
      abi.encodePacked(origin_collections, origin_token_ids, style_token_id)
    );

    if (provenanceToTokenId[_provenanceHash] != 0x0) {
      revert ProvenanceAlreadyUsed();
    }

    //EFFECTS
    uint32 nextStyleMintId = styleNFT.incrementMintedPerStyle(style_token_id);

    token_id = BytesLib.toUint64(
      abi.encodePacked(style_token_id, nextStyleMintId),
      0
    );

    provenanceToTokenId[_provenanceHash] = token_id;

    //INTERACTIONS
    splitMintFee(fee, style_token_id);
    _safeMint(msg.sender, token_id);

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
