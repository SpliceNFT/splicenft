// contracts/Splice.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/cryptography/SignatureCheckerUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/escrow/EscrowUpgradeable.sol';

import './BytesLib.sol';
import './ISpliceStyleNFT.sol';
import './SpliceStyleNFTV1.sol';
import 'hardhat/console.sol';

contract Splice is
  ERC721EnumerableUpgradeable,
  OwnableUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable
{
  using CountersUpgradeable for CountersUpgradeable.Counter;
  using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

  struct TokenHeritage {
    address requestor;
    IERC721 origin_collection;
    uint256 origin_token_id;
    uint256 style_token_id;
    //todo: this would be MUCH smaller when using bytes32 with base58 encoding,
    //see file history & Base58 library
    //not possible with nft.storage since it returns cidv1
    //we're storing the dag-cbor base32 "folder" CID
    //they're resolved as "ipfs://<metadataCID>/metadata.json
    string metadataCID;
  }

  CountersUpgradeable.Counter private _tokenIds;

  //uint256 public constant MAX_TOKENS_PER_ADDRESS = 222;
  //uint256 private constant MINT_LIMIT = 22;

  //todo shall we be able to change that?!
  uint8 public ARTIST_SHARE;

  //which collections are allowed to be spliced
  mapping(address => bool) collectionAllowList;

  //lookup table
  //keccack(0xcollection + origin_token_id) => splice token ID
  mapping(uint256 => uint256) originToTokenId;

  //splice token ID => heritage
  mapping(uint256 => TokenHeritage) tokenHeritage;

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

  function initialize(string memory name_, string memory symbol_)
    public
    initializer
  {
    __ERC721_init(name_, symbol_);
    __Ownable_init();
    ARTIST_SHARE = 85;
    //todo: unsure if a gnosis safe is payable...
    platformBeneficiary = payable(msg.sender);
    //todo check that the escrow now belongs to this contract.
    //todo ensure that the escrow can also support collection's accounts
    feesEscrow = new EscrowUpgradeable();
    feesEscrow.initialize();
    saleIsActive = false;
  }

  //todo: add more interfaces for royalties here.
  /**
   * @dev See {IERC165-supportsInterface}.
   *
   */
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721EnumerableUpgradeable)
    returns (bool)
  {
    if (interfaceId == type(IERC721Enumerable).interfaceId)
      return ERC721Upgradeable.supportsInterface(interfaceId);
    else return false;
  }

  /**
   * in case someone drops ERC20 on us accidentally,
   * this will help us withdraw it.
   * todo: does this need approval?
   */
  function withdrawERC20(IERC20 token) public onlyOwner {
    token.transfer(platformBeneficiary, token.balanceOf(address(this)));
  }

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

  //todo: we might consider dismissing this idea.
  function updateArtistShare(uint8 share) public onlyOwner {
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

  /**
   * checks if any known validator has signed the mint request
   */
  function isValidatedMint(bytes32 hash, bytes memory signature)
    public
    view
    returns (bool)
  {
    for (uint256 i = 0; i < validators.length(); i++) {
      //todo (later) provide incentive (add mint fee share) for that validator.
      if (
        SignatureCheckerUpgradeable.isValidSignatureNow(
          validators.at(i),
          hash,
          signature
        )
      ) {
        return true;
      }
    }
    return false;
  }

  function setStyleNFT(ISpliceStyleNFT _styleNFT) public onlyOwner {
    styleNFT = _styleNFT;
  }

  function getStyleNFT() public view returns (address) {
    return address(styleNFT);
  }

  function setPlatformBeneficiary(address payable newAddress) public onlyOwner {
    require(address(0) != newAddress, 'must be a real address');
    platformBeneficiary = newAddress;
  }

  function isCollectionAllowed(address collection) public view returns (bool) {
    return collectionAllowList[collection];
  }

  function _allowCollection(address collection)
    internal
    onlyOwner
    whenNotPaused
  {
    //todo check whether nft supports ERC721 interface (ERC165)
    collectionAllowList[collection] = true;
  }

  function allowCollections(address[] calldata collections)
    external
    onlyOwner
    whenNotPaused
  {
    for (uint256 i; i < collections.length; i++) {
      _allowCollection(collections[i]);
    }
  }

  //todo: disallow collection

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

  function tokenURI(uint256 token_id)
    public
    view
    override
    returns (string memory)
  {
    require(
      _exists(token_id),
      'ERC721Metadata: URI query for nonexistent token'
    );
    return tokenHeritage[token_id].metadataCID;
  }

  function findHeritage(IERC721 nft, uint256 token_id)
    public
    view
    returns (TokenHeritage memory heritage)
  {
    require(
      nft.ownerOf(token_id) != address(0),
      'the token is not minted or belongs to 0x0'
    );
    uint256 originHash = uint256(
      keccak256(abi.encodePacked(address(nft), token_id))
    );
    uint256 splice_token_id = originToTokenId[originHash];
    return (tokenHeritage[splice_token_id]);
  }

  function getHeritage(uint256 token_id)
    public
    view
    returns (TokenHeritage memory)
  {
    return tokenHeritage[token_id];
  }

  function heritageHash(address nft, uint256 token_id)
    public
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked(nft, token_id));
  }

  function getTokenOrigin(uint256 token_id)
    public
    view
    returns (address collection, uint256 originalTokenId)
  {
    TokenHeritage memory _heritage = getHeritage(token_id);
    return (address(_heritage.origin_collection), _heritage.origin_token_id);
  }

  function _toRandomness(bytes32 hash) internal pure returns (uint32) {
    bytes memory rm = abi.encodePacked(hash);
    return BytesLib.toUint32(rm, 0);
  }

  function randomness(address nft, uint256 token_id)
    public
    pure
    returns (uint32)
  {
    return _toRandomness(heritageHash(address(nft), token_id));
  }

  function quote(IERC721 nft, uint256 style_token_id)
    public
    view
    returns (uint256 fee)
  {
    require(
      styleNFT.canMintOnStyle(style_token_id),
      'the mint cap of that style has reached'
    );
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

  function mint(
    IERC721 origin_collection,
    uint256 origin_token_id,
    uint256 style_token_id,
    string calldata metadataCID,
    bytes memory your_signature,
    bytes memory verifier_signature,
    address recipient
  ) public payable whenNotPaused nonReentrant returns (uint256 token_id) {
    require(saleIsActive);

    require(
      isCollectionAllowed(address(origin_collection)),
      'splicing this collection is not allowed'
    );

    //we only allow the owner of an NFT to mint a splice of it.
    require(origin_collection.ownerOf(origin_token_id) == msg.sender);

    //todo check whether input data seems legit (cid looks like a cid)
    //todo if there's more than one mint request in one block the quoted fee might be lower
    //than what the artist expects, (when using a bonded price strategy)
    uint256 fee = quote(origin_collection, style_token_id);
    require(msg.value >= fee, 'you sent insufficient fees');

    splitMintFee(fee, style_token_id);

    bytes32 cidHash = keccak256(abi.encode(metadataCID));

    require(
      SignatureCheckerUpgradeable.isValidSignatureNow(
        msg.sender,
        cidHash,
        your_signature
      ),
      'your signature is not valid'
    );
    require(
      isValidatedMint(cidHash, verifier_signature),
      'no validator signature could be verified'
    );

    styleNFT.incrementMintedPerStyle(style_token_id);
    _tokenIds.increment();
    token_id = _tokenIds.current();

    _safeMint(recipient, token_id);

    tokenHeritage[token_id] = TokenHeritage(
      msg.sender,
      origin_collection,
      origin_token_id,
      style_token_id,
      metadataCID
    );

    originToTokenId[
      uint256(heritageHash(address(origin_collection), origin_token_id))
    ] = token_id;

    return token_id;
  }
}
