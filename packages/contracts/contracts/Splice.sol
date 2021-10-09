// contracts/TestnetNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import './BytesLib.sol';
import './SpliceValidator.sol';
import 'hardhat/console.sol';

contract Splice is ERC721EnumerableUpgradeable, OwnableUpgradeable {
  using CountersUpgradeable for CountersUpgradeable.Counter;

  enum MintJobStatus {
    REQUESTED,
    ALLOWED,
    MINTED,
    VERIFICATION_FAILED
  }

  struct MintJob {
    address requestor;
    IERC721 collection;
    //todo: this would be MUCH smaller when using bytes32 with base58 encoding,
    //see file history & Base58 library
    //not possible with nft.storage since it returns cidv1
    //we're storing the dag-cbor base32 "folder" CID
    //they're resolved as "ipfs://<metadataCID>/metadata.json
    uint256 token_id;
    string metadataCID;
    uint32 randomness;
    MintJobStatus status;
    address recipient;
  }

  CountersUpgradeable.Counter private _tokenIds;

  //uint256 public constant MAX_TOKENS_PER_ADDRESS = 222;
  //uint256 private constant MINT_LIMIT = 22;

  //how many tokens can be minted for this collection
  mapping(address => uint16) collectionAllowance;

  //how many tokens have been spliced on a collection
  mapping(address => uint16) mintedPerCollection;

  //all jobs
  mapping(uint32 => MintJob) jobs;

  //needed for lookups
  mapping(bytes32 => uint32) originToJobId;
  mapping(uint256 => uint32) tokenIdToJobId;

  uint32 numJobs;

  //todo make this dynamic, obviously
  uint256 public constant PRICE = 0.079 ether;

  SpliceValidator private validator;
  event MintRequested(uint32 indexed jobId, address indexed collection);
  event JobResultArrived(uint32 indexed jobId, bool result);

  /**
   * Network: Kovan
   * Oracle: 0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8 (Chainlink Devrel
   * Node)
   * Job ID: d5270d1c311941d0b08bead21fea7747
   * Fee: 0.1 LINK
   */
  function initialize(string memory name_, string memory symbol_)
    public
    initializer
  {
    __ERC721_init(name_, symbol_);
    __Ownable_init();

    numJobs = 1;
  }

  function setValidator(SpliceValidator _validator) public onlyOwner {
    validator = _validator;
  }

  function getValidator() public view returns (address) {
    return address(validator);
  }

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
    uint32 jobId = tokenIdToJobId[tokenId];
    return getJobMetadataURI(jobId);
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

  function collectionSupply(address collection) public view returns (uint16) {
    return mintedPerCollection[collection];
  }

  function allowCollection(address collection, uint16 tokenLimit)
    external
    onlyOwner
  {
    //todo check whether nft supports ERC721 interface (ERC165)
    collectionAllowance[collection] = tokenLimit;
  }

  function isCollectionAllowed(address collection) public view returns (bool) {
    return collectionAllowance[collection] > 0;
  }

  function getMintJob(uint32 jobId) public view returns (MintJob memory) {
    return jobs[jobId];
  }

  function findMintJob(IERC721 nft, uint256 token_id)
    public
    view
    returns (uint32 jobId, MintJob memory job)
  {
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

  function randomness(IERC721 nft, uint256 token_id)
    public
    pure
    returns (uint32)
  {
    bytes memory inp = abi.encodePacked(address(nft), token_id);
    bytes32 rb = keccak256(inp);
    bytes memory rm = abi.encodePacked(rb);
    uint32 r = BytesLib.toUint32(rm, 0);
    return r;
  }

  function requestMint(
    IERC721 nft,
    uint256 token_id,
    string memory metadataCID,
    address recipient
  ) public payable returns (uint32 jobID) {
    //todo check whether token_id exists on nft and
    //todo check nft belongs to <sender>
    //check whether input data seems legit
    //todo check that requestor has sent some minting fee (PRICE (per collection))
    //todo oracle request creation
    //wait for creation disputes

    require(
      isCollectionAllowed(address(nft)),
      'splicing this collection is not allowed'
    );
    uint16 collectionLimit = collectionAllowance[address(nft)];
    uint16 alreadyMintedOnCollection = mintedPerCollection[address(nft)];

    require(
      alreadyMintedOnCollection + 1 < collectionLimit,
      'collection is already fully minted'
    );

    uint32 rnd = randomness(nft, token_id);

    jobID = numJobs++;
    bytes32 jobMap = keccak256(abi.encodePacked(address(nft), token_id));
    originToJobId[jobMap] = jobID;

    jobs[jobID] = MintJob(
      msg.sender,
      nft,
      token_id,
      metadataCID,
      rnd,
      MintJobStatus.REQUESTED,
      recipient
    );
    emit MintRequested(jobID, address(nft));
    return jobID;
  }

  function greenlightMintByOwner(uint32 jobID, bool result) external onlyOwner {
    publishJobResult(jobID, result);
  }

  /**
   * called by a verified job runner / oracle
   *
   * important!
   * todo: restrict to oracle calls :D This is only public for demo fixing
   */
  function publishJobResult(uint32 jobID, bool valid) public {
    MintJob storage job = jobs[jobID];
    if (valid) {
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
  function finalizeMint(uint32 jobID) public returns (uint256 tokenId) {
    MintJob storage job = jobs[jobID];
    require(
      job.status == MintJobStatus.ALLOWED,
      'minting is not allowed (yet)'
    );
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();
    //require(newItemId < limit, 'exceeds max collection size');
    _safeMint(job.recipient, newItemId);
    tokenIdToJobId[newItemId] = jobID;
    job.status = MintJobStatus.MINTED;
    mintedPerCollection[address(job.collection)] =
      mintedPerCollection[address(job.collection)] +
      1;
    return newItemId;
  }
}
