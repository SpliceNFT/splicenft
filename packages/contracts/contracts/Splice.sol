// contracts/Splice.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/cryptography/SignatureCheckerUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/escrow/EscrowUpgradeable.sol';
import 'hardhat/console.sol';

import './BytesLib.sol';
import './ISpliceStyleNFT.sol';
import './SpliceStyleNFTV1.sol';

contract Splice is
  ERC721EnumerableUpgradeable,
  OwnableUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable
{
  using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

  error InsufficientFees();
  error NotOwningOrigin();
  error OriginAlreadyUsed();
  error MintingCapOnStyleReached();
  error SpliceNotFound();

  struct TokenProvenance {
    address requestor;
    IERC721 origin_collection;
    uint256 origin_token_id;
    uint32 style_token_id;
  }

  uint8 public ARTIST_SHARE;

  string private baseUri;

  //lookup table
  //keccack(0xcollection + origin_token_id + style_token_id)  => token_id
  mapping(bytes32 => uint64) public provenanceToTokenId;

  //splice token ID => provenance
  mapping(uint64 => TokenProvenance) public tokenProvenance;

  /**
   * Validators are trusted accounts that must sign minting
   * requests offchain before we allow minting them.
   */
  EnumerableSetUpgradeable.AddressSet private validators;

  /**
   * the contract that manages all styles as NFTs.
   * Styles are owned by artists and manage fee quoting.
   * Style NFTs are transferrable (you can sell your style to others)
   */
  ISpliceStyleNFT private styleNFT;

  /**
   * the SPLICE platform account, i.e. a Gnosis Safe / DAO Vault etc.
   */
  address payable public platformBeneficiary;

  /**
   * an Escrow that keeps funds safe (hope so),
   * check: https://medium.com/[at]ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
   */
  EscrowUpgradeable private feesEscrow;

  //separate killswitch than Pauseable.
  bool public saleIsActive;

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
    //todo check that the escrow now belongs to this contract.
    //todo ensure that the escrow can also support collection's accounts
    feesEscrow = new EscrowUpgradeable();
    feesEscrow.initialize();
    baseUri = baseUri_;
    saleIsActive = false;
  }

  //todo: might be unwanted.
  function setBaseUri(string memory newBaseUri) public onlyOwner {
    baseUri = newBaseUri;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseUri;
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

  function toggleSaleIsActive(bool newValue) public onlyOwner {
    saleIsActive = newValue;
  }

  function updateArtistShare(uint8 share) public onlyOwner {
    require(share > 75, 'we will never take more than 25%');
    ARTIST_SHARE = share;
  }

  function addValidator(address _validator) public onlyOwner {
    validators.add(_validator);
  }

  function removeValidator(address _validator) public onlyOwner {
    validators.remove(_validator);
  }

  function getValidators() public view returns (address[] memory) {
    return validators.values();
  }

  function setStyleNFT(ISpliceStyleNFT _styleNFT) public onlyOwner {
    styleNFT = _styleNFT;
  }

  function getStyleNFT() public view returns (address) {
    return address(styleNFT);
  }

  //todo: the platform benef. should be the only one to name a new beneficiary, not the owner.
  function setPlatformBeneficiary(address payable newAddress) public onlyOwner {
    require(address(0) != newAddress, 'must be a real address');
    platformBeneficiary = newAddress;
  }

  function findProvenance(
    IERC721 nft,
    uint256 origin_token_id,
    uint32 style_token_id
  )
    public
    view
    returns (uint64 splice_token_id, TokenProvenance memory provenance)
  {
    splice_token_id = provenanceToTokenId[
      provenanceHash(address(nft), origin_token_id, style_token_id)
    ];

    if (splice_token_id == 0x0) {
      revert SpliceNotFound();
    }

    provenance = tokenProvenance[splice_token_id];
  }

  function provenanceHash(
    address nft,
    uint256 origin_token_id,
    uint32 style_token_id
  ) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(nft, origin_token_id, style_token_id));
  }

  function randomness(bytes32 _provenanceHash) public pure returns (uint32) {
    bytes memory rm = abi.encodePacked(_provenanceHash);
    return BytesLib.toUint32(rm, 0);
  }

  function quote(IERC721 nft, uint32 style_token_id)
    public
    view
    returns (uint256 fee)
  {
    if (!styleNFT.canMintOnStyle(style_token_id)) {
      revert MintingCapOnStyleReached();
    }

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

  //todo: this way anyone could initiate the payout for any payee for gas efficiency:
  // function withdrawSharesFor(address payable payee)
  //   public
  //   nonReentrant
  //   whenNotPaused
  // {
  //   feesEscrow.withdraw(payee);
  // }

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
    bytes calldata input_params,
    uint32 style_token_id,
    address recipient
  ) public payable whenNotPaused nonReentrant returns (uint64 token_id) {
    require(saleIsActive);

    //CHECKS
    //we only allow the owner of an NFT to mint a splice of it.
    if (origin_collection.ownerOf(origin_token_id) != msg.sender)
      revert NotOwningOrigin();

    //todo if there's more than one mint request in one block the quoted fee might be lower
    //than what the artist expects, (when using a bonded price strategy)
    uint256 fee = quote(origin_collection, style_token_id);
    if (msg.value < fee) revert InsufficientFees();

    bytes32 _provenance = provenanceHash(
      address(origin_collection),
      origin_token_id,
      style_token_id
    );

    if (provenanceToTokenId[_provenance] != 0x0) {
      revert OriginAlreadyUsed();
    }

    //EFFECTS
    uint32 nextStyleMintId = styleNFT.incrementMintedPerStyle(style_token_id);

    token_id = BytesLib.toUint64(
      abi.encodePacked(style_token_id, nextStyleMintId),
      0
    );

    tokenProvenance[token_id] = TokenProvenance(
      msg.sender,
      origin_collection,
      origin_token_id,
      style_token_id
    );

    provenanceToTokenId[_provenance] = token_id;

    //INTERACTIONS
    splitMintFee(fee, style_token_id);
    _safeMint(recipient, token_id);

    return token_id;
  }
}
