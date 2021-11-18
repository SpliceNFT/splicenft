// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Withdrawable {
  function withdrawShares() external;
}

contract ChainWallet {
  event Received(address, uint256);

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }

  function withdrawShares(address splice) public {
    Withdrawable(splice).withdrawShares();
  }
}
