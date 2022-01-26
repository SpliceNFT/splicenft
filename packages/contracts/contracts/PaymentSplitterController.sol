// contracts/PaymentSplitterController.sol
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
import '@openzeppelin/contracts/proxy/Clones.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import './ReplaceablePaymentSplitter.sol';

contract PaymentSplitterController is
  Initializable,
  ReentrancyGuardUpgradeable
{
  /**
   * @dev each style tokens' payment splitter instance
   */
  mapping(uint256 => ReplaceablePaymentSplitter) public splitters;

  /**
   * @dev a list of all beneficiaries (artists, partners, platform) we know
   */
  mapping(address => address[]) public splittersOfAccount;

  address[] private PAYMENT_TOKENS;

  /**
   * @dev the base instance that minimal proxies are cloned from
   */
  address private _splitterTemplate;

  address private _owner;

  function initialize(address owner_, address[] memory paymentTokens_)
    public
    initializer
  {
    __ReentrancyGuard_init();
    _owner = owner_;
    PAYMENT_TOKENS = paymentTokens_;

    _splitterTemplate = address(new ReplaceablePaymentSplitter());
  }

  modifier onlyOwner() {
    require(msg.sender == _owner, 'only callable by owner');
    _;
  }

  function createSplit(
    uint256 tokenId,
    address[] memory payees_,
    uint256[] memory shares_
  ) public payable onlyOwner returns (address ps_address) {
    require(payees_.length == shares_.length, 'p and s len mismatch');
    require(payees_.length > 0, 'no payees');
    require(address(splitters[tokenId]) == address(0), 'ps exists');

    ps_address = Clones.clone(_splitterTemplate);
    ReplaceablePaymentSplitter ps = ReplaceablePaymentSplitter(
      payable(ps_address)
    );
    ps.initialize(address(this), tokenId, payees_, shares_);

    // ReplaceablePaymentSplitter ps = new ReplaceablePaymentSplitter();
    // ps.initialize(address(this), tokenId, payees_, shares_);

    splitters[tokenId] = ps;

    for (uint256 i = 0; i < payees_.length; i++) {
      splittersOfAccount[payees_[i]].push(ps_address);
    }
  }

  /**
   * @notice when splitters_ is [], we try to get *all* of your funds out
   * to withdraw individual tokens, use the methods on the payment splitter directly.
   */
  function withdrawAll(address payable payee, address[] memory splitters_)
    external
    nonReentrant
  {
    if (splitters_.length == 0) {
      splitters_ = splittersOfAccount[payee];
    }

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
  ) public onlyOwner nonReentrant {
    ReplaceablePaymentSplitter ps = splitters[style_token_id];
    releaseAll(ps, from);
    ps.replacePayee(from, to);
    splittersOfAccount[to].push(payable(ps));
  }
}
