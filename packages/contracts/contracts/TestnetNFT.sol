// contracts/TestnetNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract TestnetNFT is ERC721Enumerable, Ownable {
  using Counters for Counters.Counter;

  string private baseUri;
  uint32 private limit;

  Counters.Counter private _tokenIds;

  constructor(
    string memory name_,
    string memory symbol_,
    string memory baseUri_,
    uint32 limit_
  ) ERC721(name_, symbol_) Ownable() {
    baseUri = baseUri_;
    limit = limit_;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseUri;
  }

  function setBaseUri(string memory baseUri_) external onlyOwner {
    baseUri = baseUri_;
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Enumerable)
    returns (bool)
  {
    if (interfaceId == type(IERC721Enumerable).interfaceId)
      return ERC721Enumerable.supportsInterface(interfaceId);
    else return false;
  }

  function mint(address to) public returns (uint256) {
    //everyone may mint
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();
    require(newItemId < limit, 'exceeds max collection size');
    _safeMint(to, newItemId);

    return newItemId;
  }
}
