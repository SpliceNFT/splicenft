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
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
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
  ERC721EnumerableUpgradeable,
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

  /// @notice token provenance describes where a splice token came from.
  /// @dev we're not storing the style token id because it can be extracted as the first 32 bits from the splice token id
  struct TokenProvenance {
    IERC721 origin_collection;
    uint256 origin_token_id;
  }

  uint8 public ARTIST_SHARE;

  string private baseUri;

  //lookup table
  //keccak(0xcollection + origin_token_id + style_token_id)  => token_id
  mapping(bytes32 => uint64) public provenanceToTokenId;

  //splice token ID => provenance
  //todo: maybe replace with a subgraph
  mapping(uint64 => TokenProvenance) public tokenProvenance;

  //keccak(0xcollection + origin_token_id)  => splice token ids
  //todo: replace this with a subgraph.
  mapping(bytes32 => uint64[]) public originToTokenId;

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

  function initialize(
    string memory name_,
    string memory symbol_,
    string memory baseUri_
  ) public initializer {
    __ERC721_init(name_, symbol_);
    __Ownable_init();
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
   * in case someone drops ERC20 on us accidentally,
   * this will help us withdraw it.
   * todo: does this need approval?
   */
  function withdrawERC20(IERC20 token) public onlyOwner {
    token.transfer(platformBeneficiary, token.balanceOf(address(this)));
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
  }

  function spliceCountForOrigin(bytes32 _originHash)
    public
    view
    returns (uint256)
  {
    return originToTokenId[_originHash].length;
  }

  function provenanceHash(
    address nft,
    uint256 origin_token_id,
    uint32 style_token_id
  ) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(nft, origin_token_id, style_token_id));
  }

  function originHash(address nft, uint256 origin_token_id)
    public
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked(nft, origin_token_id));
  }

  /// @dev the randomness is defined as the first 32 bit of an origin hash
  function randomness(bytes32 _originHash) public pure returns (uint32) {
    return BytesLib.toUint32(abi.encodePacked(_originHash), 0);
  }

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
    feesEscrow.withdraw(payable(msg.sender));
  }

  function shareBalanceOf(address payee) public view returns (uint256) {
    return feesEscrow.depositsOf(payee);
  }

  function mint(
    IERC721 origin_collection,
    uint256 origin_token_id,
    uint32 style_token_id,
    bytes32[] memory allowlistProof,
    bytes calldata input_params
  ) public payable whenNotPaused nonReentrant returns (uint64 token_id) {
    //CHECKS
    if (origin_collection.ownerOf(origin_token_id) != msg.sender) {
      revert NotOwningOrigin();
    }

    if (
      !styleNFT.canBeMintedOnCollection(
        style_token_id,
        address(origin_collection)
      )
    ) {
      revert NotAllowedToMint('style disallows minting on this collection');
    }

    //todo if there's more than one mint request in one block the quoted fee might be lower
    //than what the artist expects, (when using a bonded price strategy)
    uint256 fee = quote(origin_collection, style_token_id);
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

    bytes32 _provenanceHash = provenanceHash(
      address(origin_collection),
      origin_token_id,
      style_token_id
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

    tokenProvenance[token_id] = TokenProvenance(
      origin_collection,
      origin_token_id
    );

    provenanceToTokenId[_provenanceHash] = token_id;
    originToTokenId[originHash(address(origin_collection), origin_token_id)]
      .push(token_id);

    //INTERACTIONS
    splitMintFee(fee, style_token_id);
    _safeMint(msg.sender, token_id);

    return token_id;
  }
}
