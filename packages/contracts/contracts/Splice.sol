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
import 'hardhat/console.sol';

contract Splice is ERC721EnumerableUpgradeable, OwnableUpgradeable {
  using CountersUpgradeable for CountersUpgradeable.Counter;

  enum MintJobStatus {
    REQUESTED,
    DONE
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
  mapping(uint256 => MintJob) jobs;

  //needed for lookups
  mapping(bytes32 => uint256) originToJobId;
  mapping(uint256 => uint256) tokenIdToJobId;

  uint256 numJobs;

  //todo make this dynamic, obviously
  uint256 public constant PRICE = 0.079 ether;

  event MintRequested(uint256 indexed jobIndex, address indexed collection);
  event JobResultArrived(uint256 indexed jobIndex);

  function initialize(string memory name_, string memory symbol_)
    public
    initializer
  {
    __ERC721_init(name_, symbol_);
    __Ownable_init();

    numJobs = 1;
  }

  function _metadataURI(string memory metadataCID)
    private
    pure
    returns (string memory)
  {
    return string(abi.encodePacked('ipfs://', metadataCID, '/metadata.json'));
  }

  function getJobMetadataURI(uint256 jobId)
    public
    view
    returns (string memory)
  {
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
    uint256 jobID = tokenIdToJobId[tokenId];
    return getJobMetadataURI(jobID);
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

  function getMintJob(uint256 jobId) public view returns (MintJob memory) {
    return jobs[jobId];
  }

  function findMintJob(IERC721 nft, uint256 token_id)
    public
    view
    returns (MintJob memory job)
  {
    bytes32 jobMap = keccak256(abi.encodePacked(address(nft), token_id));
    uint256 jobId = originToJobId[jobMap];
    return jobs[jobId];
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
  ) public payable returns (uint256 jobID) {
    //check whether token_id exists on nft and
    //belongs to <sender>
    //check whether input data seems legit
    //check minting fee sufficient
    //request creation
    //wait for creation disputes
    //mint nft to requestor
    //distribute minting fee with partners
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

  /**
   * the hash points to a metadata document
   * called by a verified job runner
   * todo shouldn't be a string ;)
   */
  function publishJobResult(uint256 jobID, string memory metadataCID) public {
    MintJob storage job = jobs[jobID];
    job.metadataCID = metadataCID;
    emit JobResultArrived(jobID);
    //todo verify the imageURL referenced in that hash's metadata doc is correct.
    //todo evaluate ways how to deliver metadata from chain
  }

  /* only requestor */
  function finalizeMint(uint256 jobID) public returns (uint256 tokenId) {
    //todo only when job is "ripe" to be minted
    MintJob memory job = jobs[jobID];
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();
    //require(newItemId < limit, 'exceeds max collection size');
    _safeMint(job.recipient, newItemId);
    tokenIdToJobId[newItemId] = jobID;

    //jobIdToTokenId[jobID] = newItemId;
    mintedPerCollection[address(job.collection)] =
      mintedPerCollection[address(job.collection)] +
      1;
    return newItemId;
  }
}
