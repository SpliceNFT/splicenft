// contracts/Splice.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
import '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol';
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
  using CountersUpgradeable for CountersUpgradeable.Counter;
  using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

  error InsufficientFees();
  error NotOwningOrigin();
  error MintingCapOnStyleReached();

  struct TokenHeritage {
    address requestor;
    IERC721 origin_collection;
    uint256 origin_token_id;
    uint256 style_token_id;
  }

  CountersUpgradeable.Counter private _tokenIds;

  uint8 public ARTIST_SHARE;

  string private baseUri;

  //lookup table
  //keccack(0xcollection + origin_token_id) => splice token ID
  mapping(uint256 => uint256) public originToTokenId;

  //splice token ID => heritage
  mapping(uint256 => TokenHeritage) public tokenHeritage;

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
    require(share < 25, 'artblocks is also taking 25 max :.)');
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

  function findHeritage(IERC721 nft, uint256 token_id)
    public
    view
    returns (uint256 splice_token_id, TokenHeritage memory heritage)
  {
    require(
      nft.ownerOf(token_id) != address(0),
      'the token is not minted or belongs to 0x0'
    );
    uint256 originHash = uint256(heritageHash(address(nft), token_id));
    splice_token_id = originToTokenId[originHash];
    heritage = tokenHeritage[splice_token_id];
  }

  function heritageHash(address nft, uint256 token_id)
    public
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked(nft, token_id));
  }

  function randomness(bytes32 _heritageHash) public pure returns (uint32) {
    bytes memory rm = abi.encodePacked(_heritageHash);
    return BytesLib.toUint32(rm, 0);
  }

  function quote(IERC721 nft, uint256 style_token_id)
    public
    view
    returns (uint256 fee)
  {
    if (!styleNFT.canMintOnStyle(style_token_id)) {
      revert MintingCapOnStyleReached();
    }

    return styleNFT.quoteFee(nft, style_token_id);
  }

  function splitMintFee(uint256 amount, uint256 style_token_id) internal {
    uint256 feeForArtist = ARTIST_SHARE * (amount / 100);
    uint256 feeForPlatform = amount - feeForArtist; //Splice takes a 15% cut

    address beneficiaryArtist = styleNFT.ownerOf(style_token_id);
    //https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    feesEscrow.deposit{ value: feeForArtist }(beneficiaryArtist);
    feesEscrow.deposit{ value: feeForPlatform }(platformBeneficiary);
    //todo: later add a share to a beneficiary of the origin collection.
  }

  //todo: check that this really works (according to the escrow code it should.)
  function withdrawShares() external nonReentrant whenNotPaused {
    //todo: this require might be not what we want. I just have it here to ensure
    //that only artists can call this.
    // require(
    //   styleNFT.balanceOf(msg.sender) > 0,
    //   'you must own at least one style to withdraw your fee shares'
    // );

    //todo: the payable cast might not be right (msg.sender might be a contract)
    feesEscrow.withdraw(payable(msg.sender));
  }

  function shareBalanceOf(address payee) public view returns (uint256) {
    return feesEscrow.depositsOf(payee);
  }

  function mint(
    IERC721 origin_collection,
    uint256 origin_token_id,
    uint256 style_token_id,
    address recipient
  ) public payable whenNotPaused nonReentrant returns (uint256 token_id) {
    require(saleIsActive);

    //we only allow the owner of an NFT to mint a splice of it.
    if (origin_collection.ownerOf(origin_token_id) != msg.sender)
      revert NotOwningOrigin();

    //todo if there's more than one mint request in one block the quoted fee might be lower
    //than what the artist expects, (when using a bonded price strategy)
    uint256 fee = quote(origin_collection, style_token_id);
    if (msg.value < fee) revert InsufficientFees();

    splitMintFee(fee, style_token_id);

    //todo: important: check that this only can called by us.
    //https://ethereum.org/de/developers/tutorials/interact-with-other-contracts-from-solidity/
    styleNFT.incrementMintedPerStyle(style_token_id);
    _tokenIds.increment();
    token_id = _tokenIds.current();

    _safeMint(recipient, token_id);

    tokenHeritage[token_id] = TokenHeritage(
      msg.sender,
      origin_collection,
      origin_token_id,
      style_token_id
    );

    bytes32 _heritageHash = heritageHash(
      address(origin_collection),
      origin_token_id
    );
    originToTokenId[uint256(_heritageHash)] = token_id;

    return token_id;
  }
}
