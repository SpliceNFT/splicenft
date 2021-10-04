// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// https://github.com/MrChico/verifyIPFS/blob/master/contracts/verifyIPFS.sol
/// @title verifyIPFS
/// @author Martin Lundfall (martin.lundfall@gmail.com)

library Base58 {
  bytes constant prefix1 = hex'0a';
  bytes constant prefix2 = hex'080212';
  bytes constant postfix = hex'18';
  bytes constant sha256MultiHash = hex'1220';
  bytes constant ALPHABET =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  /// @dev Converts hex string to base 58
  function toBase58(bytes memory source) internal pure returns (bytes memory) {
    if (source.length == 0) return new bytes(0);
    uint8[] memory digits = new uint8[](64);
    digits[0] = 0;
    uint8 digitlength = 1;
    for (uint256 i = 0; i < source.length; ++i) {
      uint256 carry = uint8(source[i]);
      for (uint256 j = 0; j < digitlength; ++j) {
        carry += uint256(digits[j]) * 256;
        digits[j] = uint8(carry % 58);
        carry = carry / 58;
      }

      while (carry > 0) {
        digits[digitlength] = uint8(carry % 58);
        digitlength++;
        carry = carry / 58;
      }
    }
    //return digits;
    return toAlphabet(reverse(truncate(digits, digitlength)));
  }

  function truncate(uint8[] memory array, uint8 length)
    internal
    pure
    returns (uint8[] memory)
  {
    uint8[] memory output = new uint8[](length);
    for (uint256 i = 0; i < length; i++) {
      output[i] = array[i];
    }
    return output;
  }

  function reverse(uint8[] memory input)
    internal
    pure
    returns (uint8[] memory)
  {
    uint8[] memory output = new uint8[](input.length);
    for (uint256 i = 0; i < input.length; i++) {
      output[i] = input[input.length - 1 - i];
    }
    return output;
  }

  function toAlphabet(uint8[] memory indices)
    internal
    pure
    returns (bytes memory)
  {
    bytes memory output = new bytes(indices.length);
    for (uint256 i = 0; i < indices.length; i++) {
      output[i] = ALPHABET[indices[i]];
    }
    return output;
  }

  function toBytes(bytes32 input) internal pure returns (bytes memory) {
    bytes memory output = new bytes(32);
    for (uint8 i = 0; i < 32; i++) {
      output[i] = input[i];
    }
    return output;
  }

  function concat(bytes memory byteArray, bytes memory byteArray2)
    internal
    pure
    returns (bytes memory)
  {
    bytes memory returnArray = new bytes(byteArray.length + byteArray2.length);
    uint256 i = 0;
    for (i; i < byteArray.length; i++) {
      returnArray[i] = byteArray[i];
    }
    for (i; i < (byteArray.length + byteArray2.length); i++) {
      returnArray[i] = byteArray2[i - byteArray.length];
    }
    return returnArray;
  }

  //https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol
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
