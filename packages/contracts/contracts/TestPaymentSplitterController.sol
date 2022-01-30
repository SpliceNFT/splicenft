// contracts/TestPaymentSplitterController.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

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

  address[] private PAYMENT_TOKENS;

  address private _splitterTemplate;

  address private _owner;

  function withdrawAll(address payable payee, address[] memory splitters_)
    external
    nonReentrant
  {
    for (uint256 i = 0; i < splitters_.length; i++) {
      releaseAll(ReplaceablePaymentSplitter(payable(splitters_[i])), payee);
    }
  }

  function releaseAll(ReplaceablePaymentSplitter ps, address payable account)
    internal
  {
    try ps.release(account) {
      /*empty*/
    } catch {
      /*empty*/
    }
    for (uint256 i = 0; i < PAYMENT_TOKENS.length; i++) {
      try ps.release(IERC20(PAYMENT_TOKENS[i]), account) {
        /*empty*/
      } catch {
        /*empty*/
      }
    }
  }

  function replaceShareholder(
    uint256 style_token_id,
    address payable from,
    address to
  ) public nonReentrant {
    ReplaceablePaymentSplitter ps = splitters[style_token_id];
    releaseAll(ps, from);
    ps.replacePayee(from, to);
  }

  function greet() external pure returns (string memory res) {
    res = 'Hello, test';
  }
}
