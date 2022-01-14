// contracts/RoyaltyPaymentSplitter.sol
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
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';

contract RoyaltyPaymentSplitter is Context {
  event PaymentReleased(address to, uint256 amount);
  event PaymentReceived(address from, uint256 amount);
  event PayeeAdded(address account, uint256 shares);

  event ERC20PaymentReleased(IERC20 indexed token, address to, uint256 amount);
  mapping(IERC20 => uint256) private _erc20TotalReleased;
  mapping(IERC20 => mapping(address => uint256)) private _erc20Released;

  uint256 private _totalShares;
  uint256 private _totalReleased;
  uint256 private _style_token_id;
  address[] private _payees;
  mapping(address => uint256) private _shares;
  mapping(address => uint256) private _released;

  function initialize(
    uint256 style_token_id,
    address[] memory payees,
    uint256[] memory shares_
  ) public payable {
    _style_token_id = style_token_id;
    for (uint256 i = 0; i < payees.length; i++) {
      _addPayee(payees[i], shares_[i]);
    }
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
  function release(address payable account) public virtual {
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

    Address.sendValue(account, payment);
    emit PaymentReleased(account, payment);
  }

  function due(address payable account) public view returns (uint256 payment) {
    uint256 totalReceived = address(this).balance + totalReleased();
    payment = _pendingPayment(account, totalReceived, released(account));
  }

  /**
   * @dev Triggers a transfer to `account` of the amount of `token` tokens they are owed, according to their
   * percentage of the total shares and their previous withdrawals. `token` must be the address of an IERC20
   * contract.
   */
  function release(IERC20 token, address account) public virtual {
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
    _totalShares = _totalShares + shares_;
    emit PayeeAdded(account, shares_);
  }
}

contract RoyaltyPaymentSplitterController {
  mapping(uint256 => address) public splitters;
  mapping(address => address payable[]) public stakes;
  RoyaltyPaymentSplitter private _firstofitskindps;
  address payable private _firstofitskind;

  constructor() {
    _firstofitskindps = new RoyaltyPaymentSplitter();
    _firstofitskind = payable(_firstofitskindps);
  }

  function addSplit(
    uint256 tokenId,
    address[] memory payees_,
    uint256[] memory shares_
  ) public payable {
    require(
      payees_.length == shares_.length,
      'PaymentSplitter: payees and shares length mismatch'
    );
    require(payees_.length > 0, 'PaymentSplitter: no payees');

    address payable ps = payable(Clones.clone(_firstofitskind));
    RoyaltyPaymentSplitter(ps).initialize(tokenId, payees_, shares_);
    splitters[tokenId] = ps;

    for (uint256 i = 0; i < payees_.length; i++) {
      stakes[payees_[i]].push(ps);
    }
  }

  function totalBalance(address payable payee)
    public
    view
    returns (uint256 total)
  {
    total = 0;
    for (uint256 i = 0; i < stakes[payee].length; i++) {
      total += RoyaltyPaymentSplitter(stakes[payee][i]).due(payee);
    }
  }

  function withdrawAll(address payable payee) external {
    for (uint256 i = 0; i < stakes[payee].length; i++) {
      RoyaltyPaymentSplitter(stakes[payee][i]).release(payee);
    }
  }
}
