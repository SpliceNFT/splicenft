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
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
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
  ReentrancyGuardUpgradeable
{
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

  uint8 public ARTIST_SHARE;

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
    string memory name_,
    string memory symbol_,
    string memory baseUri_
  ) public initializer {
    __ERC721_init(name_, symbol_);
    __Ownable_init();
    __Pausable_init();
    __ReentrancyGuard_init();
    ARTIST_SHARE = 85;
    //todo: unsure if a gnosis safe is payable...
    platformBeneficiary = payable(msg.sender);

    //todo ensure that the escrow can also support collection's accounts
    feesEscrow = new EscrowUpgradeable();
    feesEscrow.initialize();
    baseUri = baseUri_;
  }

  function setStyleNFT(SpliceStyleNFT _styleNFT) public onlyOwner {
    styleNFT = _styleNFT;
  }

  //todo: might be unwanted.
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

  /**
   * in case someone drops ERC20/ERC721 on us accidentally,
   * this will help us withdraw it.
   */
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

  //todo fallback function & withdrawal for eth for owner

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
    uint256 feeForArtist = ARTIST_SHARE * (amount / 100);
    uint256 feeForPlatform = amount - feeForArtist; //Splice takes a 15% cut

    address beneficiaryArtist = styleNFT.ownerOf(style_token_id);
    //https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    feesEscrow.deposit{ value: feeForArtist }(beneficiaryArtist);
    feesEscrow.deposit{ value: feeForPlatform }(platformBeneficiary);
    //todo: later add a share to a beneficiary of the origin collection.
  }

  function withdrawShares() external nonReentrant whenNotPaused {
    //todo: the payable cast might not be right (msg.sender might be a contract)
    uint256 balance = shareBalanceOf(msg.sender);
    feesEscrow.withdraw(payable(msg.sender));
    emit Withdrawn(msg.sender, balance);
  }

  function shareBalanceOf(address payee) public view returns (uint256) {
    return feesEscrow.depositsOf(payee);
  }

  function mint(
    IERC721[] memory origin_collections,
    uint256[] memory origin_token_ids,
    uint32 style_token_id,
    bytes32[] memory allowlistProof,
    bytes calldata input_params
  ) public payable whenNotPaused nonReentrant returns (uint64 token_id) {
    //CHECKS
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

    emit Minted(
      keccak256(abi.encodePacked(origin_collections, origin_token_ids)),
      token_id,
      style_token_id
    );
    return token_id;
  }
}
