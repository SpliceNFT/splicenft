// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SampleNFT is ERC721Enumerable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    using Counters for Counters.Counter;

    string public greeting;
    string private baseUri;

    Counters.Counter private _tokenIds;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseUri_
    ) ERC721(name_, symbol_) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        baseUri = baseUri_;
    }

    function setGreeting(string calldata newGreeting_) public {
        greeting = newGreeting_;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC721Enumerable)
        returns (bool)
    {
        if (interfaceId == type(IAccessControl).interfaceId)
            return AccessControl.supportsInterface(interfaceId);
        else if (interfaceId == type(IERC721Enumerable).interfaceId)
            return ERC721Enumerable.supportsInterface(interfaceId);
        else return false;
    }

    function mint(address to) public returns (uint256) {
        // Check that the calling account has the minter role
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _safeMint(to, newItemId);

        return newItemId;
    }
}
