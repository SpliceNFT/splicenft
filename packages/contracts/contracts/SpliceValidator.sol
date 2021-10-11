// contracts/TestnetNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
import './BytesLib.sol';
import './Splice.sol';
import 'hardhat/console.sol';

contract SpliceValidator is ChainlinkClient, Ownable {
  using Chainlink for Chainlink.Request;

  address private oracle;
  bytes32 private linkJobId;
  uint256 private linkFee;

  Splice private splice;

  /**
   * Network: Kovan
   * Oracle: 0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8 (Chainlink Devrel
   * Node)
   * Job ID: 7401f318127148a894c00c292e486ffd
   * Fee: 0.1 LINK
   */
  constructor() Ownable() {
    setPublicChainlinkToken();
    //https://docs.chain.link/docs/decentralized-oracles-ethereum-mainnet/#kovan
    oracle = 0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8;

    // GET > Uint32
    linkJobId = '7401f318127148a894c00c292e486ffd'; // official chainlink job https://docs.chain.link/docs/decentralized-oracles-ethereum-mainnet/#kovan
    //linkJobId = 'e7fbe2c2bde643788f4a76b7b09db8ff'; // anyblock https://market.link/jobs/18b93cde-ac46-4316-9c7b-b9b1f36f3ead

    // GET > Bool
    //linkJobId = '1bc99b4b57034ae4bcc3a6b6f6daaede'; //anyblock https://market.link/jobs/e02a699c-c20f-44b2-a1ca-e4d6427b8d39
    //linkJobId = '4ff328c1870548bfb5f9a27cfcad0a12' //https://market.link/jobs/5c79a99d-fd4e-49d8-9562-728230c4345b
    //linkJobId = '79a5fdd469c24d18acccc80e180ecc72'; //https://market.link/jobs/653bb064-f6a3-4465-853a-f2635e6db2c3
    //find more https://market.link/jobs/a0d7fe49-9fb2-4d7a-a53b-6f2b75d68ad8/similar
    linkFee = 0.1 * 10**18; // (Varies by network and job)
  }

  function setSplice(Splice _splice) public onlyOwner {
    splice = _splice;
  }

  function getSplice() public view returns (address) {
    return address(splice);
  }

  function setLinkJobId(bytes32 _linkJobId) public onlyOwner {
    linkJobId = _linkJobId;
  }

  function setLinkFee(uint256 _linkFee) public onlyOwner {
    linkFee = _linkFee;
  }

  function setOracle(address _oracle) public onlyOwner {
    oracle = _oracle;
  }

  function interpretOracleResponse(bytes32 response)
    internal
    pure
    returns (uint32 mintJobId, bool validation)
  {
    bytes memory mintJobBytes = abi.encodePacked(response);
    uint32 mintJobId_ = BytesLib.toUint32(mintJobBytes, 0);

    uint8 lastByte = uint8(response[31]);
    bool valid = lastByte >= 1;
    return (mintJobId_, valid);
  }

  function requestValidatorData(uint32 mintJobId)
    public
    returns (bytes32 requestId)
  {
    Chainlink.Request memory request = buildChainlinkRequest(
      linkJobId,
      address(this),
      this.fulfill.selector
    );

    request.add(
      'get',
      string(
        abi.encodePacked(
          'https://validate.getsplice.io/validate/42/',
          mintJobId
        )
      )
    );

    request.add('path', 'bytes32');
    // Sends the request
    return sendChainlinkRequestTo(oracle, request, linkFee);
  }

  function fulfill(bytes32 _requestId, bytes32 _result)
    public
    recordChainlinkFulfillment(_requestId)
  {
    (uint32 jobId, bool valid) = interpretOracleResponse(_result);
    splice.publishJobResult(jobId, valid);
  }
}
