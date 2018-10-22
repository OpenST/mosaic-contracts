// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Test: progressGatewayLink.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Gateway = artifacts.require("Gateway"),
  MockToken = artifacts.require("MockToken"),
  MessageBus = artifacts.require("MessageBus");

const GatewayKlass = require("./helpers/gateway"),
  utils = require("../../test_lib/utils"),
  Helper = require("./helpers/helper"),
  BN = require('bn.js');

const gatewayTest = new GatewayKlass();

let messageHash,
  gatewayAddress,
  coGatewayAddress,
  tokenAddress,
  unlockSecret,
  facilitatorAddress;

let gateway,
  gatewayHelper;

async function _setup(accounts){

  let hashLock = utils.generateHashLock();
  unlockSecret = hashLock.s;
  coGatewayAddress = accounts[3];
  facilitatorAddress = accounts[4];

  let mockToken = await MockToken.new();
  tokenAddress = mockToken.address;

  gateway = await Gateway.new(
    mockToken.address,
    mockToken.address,
    accounts[1],
    new BN(100),
    accounts[2],
    MessageBus.address
  );
  gatewayAddress = gateway.address;
  // gateway helper.
  gatewayHelper = new Helper(gateway);
  gatewayTest.gateway = gateway;

  let typeHash = await gatewayHelper.gatewayLinkTypeHash(),
    sender = accounts[2],
    nonce = await gatewayHelper.getNonce(sender);

  let intentHash = await gatewayHelper.hashLinkGateway(
    gatewayAddress,
    coGatewayAddress,
    MessageBus.address,
    "Mock Token",
    "MOCK",
    new BN(18),
    nonce,
    tokenAddress
  );

  let signData = await utils.signHash(
    typeHash,
    intentHash,
    nonce,
    new BN(0),
    new BN(0),
    sender);

  messageHash = signData.digest;

  // initiateGatewayLink
  let response = await gateway.initiateGatewayLink(
    coGatewayAddress,
    intentHash,
    nonce,
    sender,
    hashLock.l,
    signData.signature,
    {from: facilitatorAddress}
  );
}

async function progressGatewayLink(resultType) {
  let params = {
    messageHash: messageHash,
    unlockSecret: unlockSecret,
  };

  let expectedResult = {
    returns: {
      isSuccess: resultType == utils.ResultType.FAIL ? false: true
    },
    events: {
      GatewayLinkProgressed: {
        _messageHash: messageHash,
        _gateway: gatewayAddress,
        _cogateway: coGatewayAddress,
        _token: tokenAddress,
        _unlockSecret: unlockSecret
      }
    }
  };

  let txOption = {
    from: facilitatorAddress
  };

  await gatewayTest.progressGatewayLink(
    params,
    resultType,
    expectedResult,
    txOption
  );
}

contract('Gateway ',  function(accounts) {

  describe('progressGatewayLink', async function () {

    const oThis = this;

    beforeEach(async function() {
      await _setup(accounts);
    });

    it('should fail to progress when messageHash is 0', async function() {
      messageHash = web3.utils.asciiToHex("");
      await progressGatewayLink(utils.ResultType.FAIL);
    });

    it('should fail to progress when messageHash does not match ' +
      'with the initiateGatewayLink messageHash', async function() {
      messageHash = unlockSecret;
      await progressGatewayLink(utils.ResultType.FAIL);
    });

    it('should fail to progress when unlock secret is incorrect', async function() {
      unlockSecret = messageHash;
      await progressGatewayLink(utils.ResultType.FAIL);
    });

    it('successfully progressGatewayLink', async function() {
      await progressGatewayLink(utils.ResultType.SUCCESS);
    });

    it('should fail to progress  if already progressed', async function() {
      await progressGatewayLink(utils.ResultType.SUCCESS);
      await progressGatewayLink(utils.ResultType.FAIL);
    });

  });

});
