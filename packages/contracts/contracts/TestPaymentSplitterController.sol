// contracts/TestPaymentSplitterController.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';

import './ReplaceablePaymentSplitter.sol';
import './SpliceStyleNFT.sol';

/**
 * @dev this is used in unit tests to check contract upgradeability
 */
contract TestPaymentSplitterController is
  Initializable,
  ReentrancyGuardUpgradeable
{
  mapping(uint256 => ReplaceablePaymentSplitter) public splitters;

  mapping(address => address[]) public splittersOfAccount;

  address[] private PAYMENT_TOKENS;

  address private _splitterTemplate;

  address private _owner;

  function withdrawAll(address payable payee) external {
    withdrawAll(payee, splittersOfAccount[payee]);
  }

  function withdrawAll(address payable payee, address[] memory splitters_)
    public
  {
    for (uint256 i = 0; i < splitters_.length; i++) {
      ReplaceablePaymentSplitter ps = ReplaceablePaymentSplitter(
        payable(splitters_[i])
      );
      releaseAll(ps, payee);
    }
  }

  function releaseAll(ReplaceablePaymentSplitter ps, address payable account)
    public
  {
    ps.release(account);
    for (uint256 i = 0; i < PAYMENT_TOKENS.length; i++) {
      ps.release(IERC20(PAYMENT_TOKENS[i]), account);
    }
  }

  function replaceShareholder(
    uint256 style_token_id,
    address payable from,
    address to
  ) public {
    ReplaceablePaymentSplitter ps = splitters[style_token_id];
    releaseAll(ps, from);
    ps.replacePayee(from, to);
    splittersOfAccount[to].push(payable(ps));
  }

  function greet() external pure returns (string memory res) {
    res = 'Hello, test';
  }
}
