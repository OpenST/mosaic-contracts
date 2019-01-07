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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Gateway = artifacts.require("./TestEIP20Gateway.sol");
const MockToken = artifacts.require("MockToken");

const BN = require('bn.js');
const GatewayUtils = require('./helpers/gateway_utils.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = "0x0000000000000000000000000000000000000000";
const ZeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000";
contract('EIP20Gateway.progressStake()', function (accounts) {

  let gateway, mockToken;
  let bountyAmount = new BN(100);

  let unstakeRequest = {
    beneficiary: accounts[6],
    amount: new BN(100),
  };

  let unstakeMessage = {
    intentHash: web3.utils.sha3("dummy"),
    nonce: new BN(1),
    gasPrice: new BN(1),
    gasLimit: new BN(2),
    unstakeAccount: accounts[8],
  };

  let MessageStatusEnum = {
    Undeclared: 0,
    Declared: 1,
    Progressed: 2,
    DeclaredRevocation: 3,
    Revoked: 4,
  };

  let gatewayUtils;

  beforeEach(async function () {

    mockToken = await MockToken.new({ from: accounts[0] });

    let owner = accounts[2];
    let worker = accounts[7];
    let organizationAddress = accounts[3];
    let baseTokenAddress = accounts[4];
    let coreAddress = accounts[5];
    let burnerAddress = NullAddress;

    gateway = await Gateway.new(
      mockToken.address,
      baseTokenAddress,
      coreAddress,
      bountyAmount,
      organizationAddress,
      burnerAddress,
    );

    gatewayUtils = new GatewayUtils(gateway, mockToken, baseToken);

    let hashLockObj = Utils.generateHashLock();

    unstakeMessage.hashLock = hashLockObj.l;
    unstakeMessage.unlockSecret = hashLockObj.s;
    unstakeMessage.messageHash = messageBus.messageDigest(
      unstakeMessage.intentHash,
      unstakeMessage.nonce,
      unstakeMessage.gasPrice,
      unstakeMessage.gasLimit,
      unstakeMessage.unstakeAccount,
      unstakeMessage.hashLock,
    );

    await gateway.setUnstake(
      unstakeMessage.messageHash,
      unstakeRequest.beneficiary,
      unstakeRequest.amount,
    );
    await gateway.setMessage(
      unstakeMessage.messageHash,
      unstakeMessage.intentHash,
      unstakeMessage.nonce,
      unstakeMessage.gasPrice,
      unstakeMessage.gasLimit,
      unstakeMessage.unstakeAccount,
      unstakeMessage.hashLock,
    );

  });

  it('should fail when message hash is zero', async function () {

  });

  it('should fail when unlock secret is incorrect', async function () {

  });

  it('should fail when unstake message is undeclared', async function () {

  });

  it('should fail when unstake message is already progressed', async function () {

  });

  it('should fail for revoked redeem(unstake) message', async function () {

  });

  it('should fail when redeem(unstake) message status is revocation declared',
    async function () {

  });

  it('should fail when the reward amount is greater than the unstake amount',
    async function () {

  });

  it('should return correct "redeemAmount", "unstakeAmount" and ' +
    '"rewardAmount" when gas price is zero', async function () {

  });

  it('should return correct "redeemAmount", "unstakeAmount" and ' +
    '"rewardAmount" when gas price is greater than zero', async function () {

  });

  it('should emit "UnstakeProgressed" event', async function () {

  });

  it('should unstake token to the beneficiary address', async function () {

  });

  it('should reward the facilitator', async function () {

  });


});
