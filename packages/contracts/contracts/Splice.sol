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

contract Splice is ERC721EnumerableUpgradeable, OwnableUpgradeable {
  using CountersUpgradeable for CountersUpgradeable.Counter;

  string private baseUri;
  uint32 private limit;

  enum MintJobStatus {
    REQUESTED,
    DONE
  }

  struct MintJob {
    address buyer;
    IERC721 nft;
    string ipfsMetadataHash;
    address recipient;
    uint256 token_id;
    MintJobStatus status;
  }

  CountersUpgradeable.Counter private _tokenIds;
  mapping(uint256 => MintJob) jobs;
  mapping(uint256 => uint256) jobIdToTokenId;
  uint256 numJobs;
  uint16 public MAX_PER_COLLECTION;
  mapping(address => uint16) mintedPerCollection;

  event MintRequested(uint256 indexed jobIndex, address indexed collection);
  event JobResultArrived(uint256 indexed jobIndex);

  function initialize(
    string memory name_,
    string memory symbol_,
    string memory baseUri_,
    uint32 limit_
  ) public initializer {
    __ERC721_init(name_, symbol_);
    __Ownable_init();
    baseUri = baseUri_;
    limit = limit_;
    MAX_PER_COLLECTION = 10000;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseUri;
  }

  function setBaseUri(string memory baseUri_) external onlyOwner {
    baseUri = baseUri_;
  }

  function updateMaxPerCollection(uint16 _max) external onlyOwner {
    MAX_PER_COLLECTION = _max;
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

  function tokenURIByJobId(uint256 jobID) public view returns (string memory) {
    uint256 tokenId = jobIdToTokenId[jobID];
    return tokenURI(tokenId);
  }

  function collectionSupply(address nft) public view returns (uint16) {
    return mintedPerCollection[nft];
  }

  function requestMint(
    IERC721 nft,
    uint256 token_id,
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
    jobID = numJobs++;
    uint16 alreadyMintedOnCollection = mintedPerCollection[address(nft)];

    require(
      alreadyMintedOnCollection + 1 < MAX_PER_COLLECTION,
      'collection is already fully minted'
    );

    jobs[jobID] = MintJob(
      msg.sender,
      nft,
      '',
      recipient,
      token_id,
      MintJobStatus.REQUESTED
    );
    emit MintRequested(jobID, address(nft));
    return jobID;
  }

  /**
   * the hash points to a metadata document
   * called by a verified job runner
   * todo shouldn't be a string ;)
   */
  function publishJobResult(uint256 jobID, string memory ipfsMetadataHash)
    public
  {
    MintJob storage job = jobs[jobID];
    job.ipfsMetadataHash = ipfsMetadataHash;
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
    jobIdToTokenId[jobID] = newItemId;
    mintedPerCollection[address(job.nft)] =
      mintedPerCollection[address(job.nft)] +
      1;
    return newItemId;
  }
}
