// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Withdrawable {
  function claimShares(address payable) external;
}

contract ChainWallet {
  event Received(address by, uint256 val);

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }

  function withdrawShares(address splice) public {
    Withdrawable(splice).claimShares(payable(this));
  }
}
