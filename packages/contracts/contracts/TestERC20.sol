// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol';

contract GLDToken is ERC20PresetMinterPauser {
  constructor(uint256 initialSupply) ERC20PresetMinterPauser('Gold', 'GLD') {
    _mint(msg.sender, initialSupply);
  }
}
