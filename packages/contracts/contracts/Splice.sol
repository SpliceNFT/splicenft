// contracts/Splice.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
//import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";
import '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import './BytesLib.sol';
import './SpliceValidator.sol';
import './ISpliceStyleNFT.sol';
import './SpliceStyleNFTV1.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import 'hardhat/console.sol';

contract Splice is
  ERC721EnumerableUpgradeable,
  OwnableUpgradeable,
  PausableUpgradeable
{
  using CountersUpgradeable for CountersUpgradeable.Counter;

  enum MintJobStatus {
    REQUESTED,
    ALLOWED,
    MINTED,
    VERIFICATION_FAILED
  }

  struct MintJob {
    address requestor;
    uint256 style_token_id;
    IERC721 collection;
    uint256 token_id;
    //todo: this would be MUCH smaller when using bytes32 with base58 encoding,
    //see file history & Base58 library
    //not possible with nft.storage since it returns cidv1
    //we're storing the dag-cbor base32 "folder" CID
    //they're resolved as "ipfs://<metadataCID>/metadata.json
    string metadataCID;
    MintJobStatus status;
    address recipient;
  }

  CountersUpgradeable.Counter private _tokenIds;

  //uint256 public constant MAX_TOKENS_PER_ADDRESS = 222;
  //uint256 private constant MINT_LIMIT = 22;

  //which collections are allowed to mint upon
  mapping(address => bool) collectionAllowList;

  //all jobs
  //todo make enumerable (by user ;) )
  mapping(uint32 => MintJob) jobs;

  //keccack(0xcollection + origin_token_id) => splice nft job id
  mapping(bytes32 => uint32) originToJobId;
  mapping(uint256 => uint32) tokenIdToJobId;

  uint32 numJobs;

  SpliceValidator private validator;
  ISpliceStyleNFT private styleNFT;

  event MintRequested(uint32 indexed jobId, address indexed collection);
  event JobResultArrived(uint32 indexed jobId, bool result);

  function initialize(string memory name_, string memory symbol_)
    public
    initializer
  {
    __ERC721_init(name_, symbol_);
    __Ownable_init();

    numJobs = 1;
  }

  /**
   * @dev See {IERC165-supportsInterface}.
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

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function setValidator(SpliceValidator _validator) public onlyOwner {
    validator = _validator;
  }

  function getValidator() public view returns (address) {
    return address(validator);
  }

  function setStyleNFT(ISpliceStyleNFT _styleNFT) public onlyOwner {
    styleNFT = _styleNFT;
  }

  function getStyleNFT() public view returns (address) {
    return address(styleNFT);
  }

  function getMintJob(uint32 jobId) public view returns (MintJob memory) {
    return jobs[jobId];
  }

  function isCollectionAllowed(address collection) public view returns (bool) {
    return collectionAllowList[address];
  }

  function allowCollection(address collection)
    external
    onlyOwner
    whenNotPaused
  {
    //todo check whether nft supports ERC721 interface (ERC165)
    collectionAllowList[address] = true;
  }

  function allowCollections(address[] calldata collections)
    external
    onlyOwner
    whenNotPaused
  {
    for (uint256 i; i < collections.length; i++) {
      this.allowCollection(collections[i]);
    }
  }

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

  function getJobMetadataURI(uint32 jobId) public view returns (string memory) {
    MintJob memory job = jobs[jobId];
    // bytes memory b58 = Base58.toBase58(
    //   Base58.concat(Base58.sha256MultiHash, Base58.toBytes(job.cid))
    // );
    //return string(b58);
    return _metadataURI(job.metadataCID);
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
    uint32 jobId = tokenIdToJobId[token_id];
    return getJobMetadataURI(jobId);
  }

  function findMintJob(IERC721 nft, uint256 token_id)
    public
    view
    returns (uint32 jobId, MintJob memory job)
  {
    require(_exists(token_id), 'nonexistent token');
    bytes32 jobMap = keccak256(abi.encodePacked(address(nft), token_id));
    uint32 jobId_ = originToJobId[jobMap];
    return (jobId_, jobs[jobId_]);
  }

  function getTokenOrigin(uint256 token_id)
    public
    view
    returns (address collection, uint256 originalTokenId)
  {
    MintJob memory job = jobs[tokenIdToJobId[token_id]];
    return (address(job.collection), job.token_id);
  }

  function _toRandomness(bytes memory hash) internal returns (uint32) {
    bytes32 rb = keccak256(hash);
    bytes memory rm = abi.encodePacked(rb);
    return BytesLib.toUint32(rm, 0);
  }

  function randomness(IERC721 nft, uint256 token_id)
    public
    pure
    returns (uint32)
  {
    bytes memory inp = abi.encodePacked(address(nft), token_id);
    return _toRandomness(inp);
  }

  function quote(IERC721 nft, uint256 style_token_id)
    public
    view
    returns (uint256 fee)
  {
    require(
      styleNFT.canMintOnStyle(style_token_id),
      'the limit of that style has reached'
    );
    return styleNFT.quoteFee(style_token_id, nft);
  }

  function requestMint(
    IERC721 nft,
    uint256 style_token_id,
    string memory metadataCID,
    uint256 token_id,
    address recipient
  ) public payable whenNotPaused returns (uint32 jobID) {
    require(
      isCollectionAllowed(address(nft)),
      'splicing this collection is not allowed'
    );

    require(nft.ownerOf(token_id) == msg.sender);
    //todo check whether input data seems legit (cid looks like a cid)

    //todo if there's more than one mint request in one block this might be lower
    //than what the artist expect, depending on the price strategy.
    uint256 fee = quote(nft, style_token_id);
    require(msg.value >= fee, 'insufficient fees');

    //todo oracle request creation
    //or wait for creation disputes

    bytes32 jobMap = keccak256(abi.encodePacked(address(nft), token_id));
    uint32 rnd = _toRandomness(jobMap);

    jobID = numJobs++;
    originToJobId[jobMap] = jobID;

    jobs[jobID] = MintJob(
      msg.sender,
      nft,
      token_id,
      style_token_id,
      metadataCID,
      rnd,
      MintJobStatus.REQUESTED,
      recipient
    );
    emit MintRequested(jobID, address(nft));
    return jobID;
  }

//todo onlyValidator (contract or EOA)
  function greenlightMintByOwner(uint32 jobID, bool result)
    external
    whenNotPaused
    onlyOwner
  {
    publishJobResult(jobID, result);
  }

  /**
   * called by a verified job runner / oracle
   *
   * important!
   * //todo onlyValidator (contract or EOA)
   */
  function publishJobResult(uint32 jobID, bool valid) public whenNotPaused onlyOwner {
    MintJob storage job = jobs[jobID];
    if (valid == true) {
      job.status = MintJobStatus.ALLOWED;
    } else {
      job.status = MintJobStatus.VERIFICATION_FAILED;
    }
    emit JobResultArrived(jobID, valid);
  }

  /*
   * todo only requestor
   * todo check that new item id is below the collection allowance
   * todo distribute minting fee with partners
   */
  function finalizeMint(uint32 jobID)
    public
    whenNotPaused
    returns (uint256 tokenId)
  {
    MintJob storage job = jobs[jobID];
    require(
      job.status == MintJobStatus.ALLOWED,
      'minting is not allowed (yet)'
    );

    spliceNft
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();

    _safeMint(job.recipient, newItemId);
    tokenIdToJobId[newItemId] = jobID;
    job.status = MintJobStatus.MINTED;
    mintedPerCollection[address(job.collection)] =
      mintedPerCollection[address(job.collection)] +
      1;
    return newItemId;
  }
}
