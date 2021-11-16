// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

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

  function toUint64(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (uint64)
  {
    require(_bytes.length >= _start + 8, 'toUint64_outOfBounds');
    uint64 tempUint;

    assembly {
      tempUint := mload(add(add(_bytes, 0x8), _start))
    }

    return tempUint;
  }

  //https://stackoverflow.com/questions/47129173/how-to-convert-uint-to-string-in-solidity
  function uintToString(uint256 _i)
    internal
    pure
    returns (string memory _uintAsString)
  {
    if (_i == 0) {
      return '0';
    }
    uint256 j = _i;
    uint256 len;
    while (j != 0) {
      len++;
      j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint256 k = len;
    while (_i != 0) {
      k = k - 1;
      uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
      bytes1 b1 = bytes1(temp);
      bstr[k] = b1;
      _i /= 10;
    }
    return string(bstr);
  }
}
