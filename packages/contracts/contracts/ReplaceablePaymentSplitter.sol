// contracts/ReplaceablePaymentSplitter.sol
// SPDX-License-Identifier: MIT

/*
     LCL  SSL      CSL  SSL      LCI       ISL       LCL  ISL        CI  ISL
     PEE  EEL      EES LEEL      IEE       EEI       PEE  EES       LEEL EES
     PEE  EEL      EES LEEL      IEE       EEI       PEE  EES       LEEL EES
     PEE  EEL      EES LEEL      IEE       LL        PEE  EES       LEEL LL 
     PEE  EEL      EES LEEL      IEE                 PEE  EES       LEEL    
     PEE  EEL      EES LEEL      IEE                 PEE  EES       LEEL LLL
     PEE  LL       EES LEEL      IEE       IPL       PEE  LLL       LEEL EES
LLL  PEE           EES  SSL      IEE       PEC       PEE  LLL       LEEL EES
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL LLL
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL    
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL LL 
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL EES
SEE  PEE           EES           IEE       PEC       PEE  EES       LEEL EES
LSI  LSI           LCL           LSS       ISL       LSI  ISL       LSS  ISL
*/

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';
import './SpliceStyleNFT.sol';

/**
 * this is an initializeable PaymentSplitter with an additional replace function to
 * update the payees when the owner of the underlying royalty bearing asset has
 * changed. Cannot extend PaymentSplitter because its members are private.
 */
contract ReplaceablePaymentSplitter is Context, Initializable {
  event PayeeAdded(address account, uint256 shares);
  event PaymentReleased(address to, uint256 amount);
  event ERC20PaymentReleased(IERC20 indexed token, address to, uint256 amount);
  event PaymentReceived(address from, uint256 amount);

  uint256 private _totalShares;
  uint256 private _totalReleased;

  mapping(address => uint256) private _shares;
  mapping(address => uint256) private _released;
  address[] private _payees;

  mapping(IERC20 => uint256) private _erc20TotalReleased;
  mapping(IERC20 => mapping(address => uint256)) private _erc20Released;

  address private _controller;

  modifier onlyController() {
    require(msg.sender == address(_controller), 'only callable by controller');
    _;
  }

  function initialize(
    address controller,
    address[] memory payees_,
    uint256[] memory shares_
  ) external payable initializer {
    require(controller != address(0), 'controller mustnt be 0');
    _controller = controller;

    uint256 len = payees_.length;
    uint256 __totalShares = _totalShares;
    for (uint256 i = 0; i < len; i++) {
      _addPayee(payees_[i], shares_[i]);
      __totalShares += shares_[i];
    }
    _totalShares = __totalShares;
  }

  receive() external payable virtual {
    emit PaymentReceived(_msgSender(), msg.value);
  }

  /**
   * @dev Getter for the total shares held by payees.
   */
  function totalShares() public view returns (uint256) {
    return _totalShares;
  }

  /**
   * @dev Getter for the total amount of Ether already released.
   */
  function totalReleased() public view returns (uint256) {
    return _totalReleased;
  }

  /**
   * @dev Getter for the total amount of `token` already released. `token` should be the address of an IERC20
   * contract.
   */
  function totalReleased(IERC20 token) public view returns (uint256) {
    return _erc20TotalReleased[token];
  }

  /**
   * @dev Getter for the amount of shares held by an account.
   */
  function shares(address account) public view returns (uint256) {
    return _shares[account];
  }

  /**
   * @dev Getter for the amount of Ether already released to a payee.
   */
  function released(address account) public view returns (uint256) {
    return _released[account];
  }

  /**
   * @dev Getter for the amount of `token` tokens already released to a payee. `token` should be the address of an
   * IERC20 contract.
   */
  function released(IERC20 token, address account)
    public
    view
    returns (uint256)
  {
    return _erc20Released[token][account];
  }

  /**
   * @dev Getter for the address of the payee number `index`.
   */
  function payee(uint256 index) public view returns (address) {
    return _payees[index];
  }

  /**
   * @dev Triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
   * total shares and their previous withdrawals.
   */
  function release(address payable account) external virtual {
    require(_shares[account] > 0, 'PaymentSplitter: account has no shares');

    uint256 totalReceived = address(this).balance + totalReleased();
    uint256 payment = _pendingPayment(
      account,
      totalReceived,
      released(account)
    );

    require(payment != 0, 'PaymentSplitter: account is not due payment');

    _released[account] += payment;
    _totalReleased += payment;

    AddressUpgradeable.sendValue(account, payment);
    emit PaymentReleased(account, payment);
  }

  /**
   * @dev Triggers a transfer to `account` of the amount of `token` tokens they are owed, according to their
   * percentage of the total shares and their previous withdrawals. `token` must be the address of an IERC20
   * contract.
   */
  function release(IERC20 token, address account) external virtual {
    require(_shares[account] > 0, 'PaymentSplitter: account has no shares');

    uint256 totalReceived = token.balanceOf(address(this)) +
      totalReleased(token);
    uint256 payment = _pendingPayment(
      account,
      totalReceived,
      released(token, account)
    );

    require(payment != 0, 'PaymentSplitter: account is not due payment');

    _erc20Released[token][account] += payment;
    _erc20TotalReleased[token] += payment;

    SafeERC20.safeTransfer(token, account, payment);
    emit ERC20PaymentReleased(token, account, payment);
  }

  /**
   * @dev internal logic for computing the pending payment of an `account` given the token historical balances and
   * already released amounts.
   */
  function _pendingPayment(
    address account,
    uint256 totalReceived,
    uint256 alreadyReleased
  ) private view returns (uint256) {
    return (totalReceived * _shares[account]) / _totalShares - alreadyReleased;
  }

  /**
   * @dev Add a new payee to the contract.
   * @param account The address of the payee to add.
   * @param shares_ The number of shares owned by the payee.
   */
  function _addPayee(address account, uint256 shares_) private {
    require(
      account != address(0),
      'PaymentSplitter: account is the zero address'
    );
    require(shares_ > 0, 'PaymentSplitter: shares are 0');
    require(
      _shares[account] == 0,
      'PaymentSplitter: account already has shares'
    );

    _payees.push(account);
    _shares[account] = shares_;
    emit PayeeAdded(account, shares_);
  }

  /**
   * @dev the _new payee will receive splits at the same rate as _old did before
   *      all pending payouts of _old can be withdrawn by _new.
   * @notice this pays out all Eth funds before replacing the old share holder
   */
  function replacePayee(address old, address _new) external onlyController {
    uint256 oldShares = _shares[old];
    require(oldShares > 0, 'PaymentSplitter: old account has no shares');
    require(_new != address(0), 'PaymentSplitter: account is the zero address');
    require(_shares[_new] == 0, 'PaymentSplitter: account already has shares');

    uint256 idx = 0;
    while (idx < _payees.length) {
      if (_payees[idx] == old) {
        _payees[idx] = _new;
        _shares[old] = 0;
        _shares[_new] = oldShares;
        _released[_new] = _released[old];
        emit PayeeAdded(_new, oldShares);
        return;
      }
      idx++;
    }
  }

  function due(address account) external view returns (uint256 pending) {
    uint256 totalReceived = address(this).balance + totalReleased();
    return _pendingPayment(account, totalReceived, released(account));
  }

  function due(IERC20 token, address account)
    external
    view
    returns (uint256 pending)
  {
    uint256 totalReceived = token.balanceOf(address(this)) +
      totalReleased(token);
    return _pendingPayment(account, totalReceived, released(token, account));
  }
}
