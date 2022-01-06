// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

//https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol
library ArrayLib {
  function contains(address[] memory arr, address item)
    internal
    pure
    returns (bool)
  {
    for (uint256 j = 0; j < arr.length; j++) {
      if (arr[j] == item) return true;
    }
    return false;
  }
}
