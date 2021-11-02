// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

//https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol
library BytesLib {
  function toUint32(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (uint32)
  {
    require(_bytes.length >= _start + 4, 'toUint32_outOfBounds');
    uint32 tempUint;

    assembly {
      tempUint := mload(add(add(_bytes, 0x4), _start))
    }

    return tempUint;
  }
}
