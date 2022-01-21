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
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './ReplaceablePaymentSplitter.sol';
import './SpliceStyleNFT.sol';

contract PaymentSplitterController is
  Initializable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable
{
  /**
   * @dev each style tokens' payment splitter instance
   */
  mapping(uint256 => ReplaceablePaymentSplitter) public splitters;

  /**
   * @dev a list of all beneficiaries (artists, partners, platform) we know
   */
  mapping(address => address[]) public splitsOfAccount;

  address[] private PAYMENT_TOKENS;

  /**
   * @dev the base instance that minimal proxies are cloned from
   */
  address private _splitterTemplate;

  SpliceStyleNFT private styleNFT;

  function initialize(SpliceStyleNFT styleNFT_, address[] memory paymentTokens_)
    public
    initializer
  {
    __Ownable_init_unchained();
    __ReentrancyGuard_init();
    styleNFT = styleNFT_;
    PAYMENT_TOKENS = paymentTokens_;
    // [
    //   0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, //WETH9
    //   0xdAC17F958D2ee523a2206206994597C13D831ec7, //USDT
    //   0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, //USDC
    //   0x6B175474E89094C44Da98b954EedeAC495271d0F // DAI
    // ];
    _splitterTemplate = address(new ReplaceablePaymentSplitter());
  }

  modifier onlyStyleNFT() {
    require(msg.sender == address(styleNFT), 'only callable by Style NFT');
    _;
  }

  function createSplit(
    uint256 tokenId,
    address[] memory payees_,
    uint256[] memory shares_
  ) public payable onlyStyleNFT returns (address ps_address) {
    require(
      payees_.length == shares_.length,
      'PaymentSplitter: payees and shares length mismatch'
    );
    require(payees_.length > 0, 'PaymentSplitter: no payees');

    ps_address = Clones.clone(_splitterTemplate);
    ReplaceablePaymentSplitter ps = ReplaceablePaymentSplitter(
      payable(ps_address)
    );
    ps.initialize(address(this), tokenId, payees_, shares_);
    splitters[tokenId] = ps;

    for (uint256 i = 0; i < payees_.length; i++) {
      splitsOfAccount[payees_[i]].push(ps_address);
    }
  }

  function withdrawAll(address payable payee) external {
    for (uint256 i = 0; i < splitsOfAccount[payee].length; i++) {
      ReplaceablePaymentSplitter ps = ReplaceablePaymentSplitter(
        payable(splitsOfAccount[payee][i])
      );
      releaseAll(ps, payee);
    }
  }

  function releaseAll(ReplaceablePaymentSplitter ps, address payable account)
    public
    nonReentrant
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
  ) public onlyStyleNFT {
    ReplaceablePaymentSplitter ps = splitters[style_token_id];
    releaseAll(ps, from);
    ps.replacePayee(from, to);
    splitsOfAccount[to].push(payable(ps));
  }
}
