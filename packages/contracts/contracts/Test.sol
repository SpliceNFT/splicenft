// contracts/TestnetNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './BytesLib.sol';
import 'hardhat/console.sol';

contract Test {
  function mintJobResponse(bytes32 response)
    public
    pure
    returns (uint32 mintJobId, bool validation)
  {
    bytes memory mintJobBytes = abi.encodePacked(response);
    uint32 mintJobId_ = BytesLib.toUint32(mintJobBytes, 0);

    uint8 lastByte = uint8(response[31]);
    bool valid = lastByte > 1;
    return (mintJobId_, valid);
  }
}
