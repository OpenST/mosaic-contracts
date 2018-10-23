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
// Test: stake.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Gateway = artifacts.require("MockEIP20Gateway"),
  MockToken = artifacts.require("MockToken"),
  MessageBus = artifacts.require("MessageBus"),
  GatewayLib = artifacts.require("GatewayLib");

const utils = require("./../../test_lib/utils"),
  BN = require('bn.js'),
  EIP20GatewayKlass = require("./helpers/eip20gateway"),
  HelperKlass = require("./helpers/helper");

const PENALTY_PERCENT = 1.5;

let stakeAmount,
  beneficiary,
  stakerAddress,
  gasPrice,
  gasLimit,
  nonce,
  hashLock,
  signature,
  messageHash,
  facilitator,
  bountyAmount;

let mockToken,
  baseToken,
  gateway,
  helper,
  hashLockObj,
  gatewayTest,
  errorMessage;


async function _setup (accounts){

  mockToken = await MockToken.new();
  baseToken = await MockToken.new();

  bountyAmount = new BN(100);

  gateway = await Gateway.new(
    mockToken.address,
    baseToken.address,
    accounts[1], //core address
    bountyAmount,
    accounts[2], // organisation address
    MessageBus.address
  );

  helper = new HelperKlass(gateway);
  gatewayTest = new EIP20GatewayKlass(gateway, mockToken, baseToken);

  hashLockObj = utils.generateHashLock();

  facilitator = accounts[4];
  nonce = await  helper.getNonce(accounts[1]);
  stakeAmount = new BN(100000000000);
  beneficiary = accounts[2];
  stakerAddress = accounts[1];
  gasPrice = new BN(200);
  gasLimit = new BN(900000);
  hashLock = hashLockObj.l;


  await mockToken.transfer(stakerAddress, stakeAmount, {from: accounts[0]});
  await mockToken.approve(gateway.address, stakeAmount, {from: stakerAddress});

  await baseToken.transfer(facilitator, bountyAmount, {from: accounts[0]});
  await baseToken.approve(gateway.address, bountyAmount, {from: facilitator});

  errorMessage = "";
}

async function _prepareData(){
  let typeHash = await helper.stakeTypeHash();

  let intentHash = await helper.hashStakingIntent(
    stakeAmount,
    beneficiary,
    stakerAddress,
    nonce,
    gasPrice,
    gasLimit,
    mockToken.address
  );

  let signData = await utils.signHash(
    typeHash,
    intentHash,
    nonce,
    gasPrice,
    gasLimit,
    stakerAddress);

  signature = signData.signature;
  messageHash = signData.digest;
}

async function _stake (resultType) {

  let params = {
    amount: stakeAmount,
    beneficiary: beneficiary,
    staker: stakerAddress,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    nonce: nonce,
    hashLock: hashLock,
    signature: signature,
  };

  let expectedResult = {
    returns: {messageHash: messageHash},
    events: {
      StakingIntentDeclared: {
        _messageHash: messageHash,
        _staker: stakerAddress,
        _stakerNonce: nonce,
        _beneficiary: beneficiary,
        _amount: stakeAmount
      }
    },
    errorMessage: errorMessage
  };

  let txOption = {
    from: facilitator
  };

  await gatewayTest.stake(
    params,
    resultType,
    expectedResult,
    txOption
  );
}

contract('EIP20Gateway ',  function(accounts) {

  describe('stake', async function () {

    beforeEach(async function() {
      await _setup(accounts);
    });

    it('should fail to stake when stake amount is 0', async function() {
      stakeAmount = new BN(0);
      errorMessage = "Stake amount must not be zero";
      await _prepareData();
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when beneficiary address is 0', async function() {
      beneficiary = "0x0000000000000000000000000000000000000000";
      errorMessage = "Beneficiary address must not be zero";
      await _prepareData();
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when gas price is 0', async function() {
      gasPrice = new BN(0);
      errorMessage = "Gas price must not be zero";
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when gas limit is 0', async function() {
      gasLimit = new BN(0);
      errorMessage = "Gas limit must not be zero";
      await _prepareData();
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when signature is not of length 65 (invalid bytes)', async function() {
      await _prepareData();
      signature = accounts[9];
      errorMessage = "Signature must be of length 65";
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when signature is invalid (not signed by staker)', async function() {
      await _prepareData();
      let typeHash = await helper.stakeTypeHash();

      let intentHash = await helper.hashStakingIntent(
        stakeAmount,
        beneficiary,
        stakerAddress,
        nonce,
        gasPrice,
        gasLimit,
        mockToken.address
      );

      let signData = await utils.signHash(
        typeHash,
        intentHash,
        nonce,
        gasPrice,
        gasLimit,
        accounts[9]);

      signature = signData.signature;
      errorMessage = "Invalid signature";

      await _stake(utils.ResultType.FAIL);

    });

    it('should fail to stake when staker has balance less than the stake amount', async function() {
      stakeAmount = new BN(200000000000);
      await mockToken.approve(gateway.address, stakeAmount, {from: stakerAddress});
      await _prepareData();
      errorMessage = "revert";
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when facilitator has balance less than the bounty amount', async function() {
      await baseToken.transfer(accounts[0], new BN(50), {from: facilitator});
      await _prepareData();
      errorMessage = "revert";
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when gateway is not approved by the staker', async function() {
      stakerAddress = accounts[5];
      await mockToken.transfer(stakerAddress, stakeAmount, {from: accounts[0]});
      await _prepareData();
      errorMessage = "revert";
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when gateway is not approved by the facilitator', async function() {
      facilitator = accounts[6];
      await baseToken.transfer(facilitator, bountyAmount, {from: accounts[0]});
      await _prepareData();
      errorMessage = "revert";
      await _stake(utils.ResultType.FAIL);
    });

    it('should successfully stake', async function() {
      await _prepareData();
      await _stake(utils.ResultType.SUCCESS);
    });

    it('should fail when its already staked with same data (replay attack)', async function() {

      await _prepareData();
      await _stake(utils.ResultType.SUCCESS);

      await mockToken.transfer(stakerAddress, stakeAmount, {from: accounts[0]});
      await baseToken.transfer(facilitator, bountyAmount, {from: accounts[0]});
      await mockToken.approve(gateway.address, stakeAmount, {from: stakerAddress});
      await baseToken.approve(gateway.address, bountyAmount, {from: facilitator});

      errorMessage = "Invalid nonce";
      await _stake(utils.ResultType.FAIL);
    });

    it('should fail to stake when previous stake for same address is not progressed', async function() {

      await _prepareData();
      await _stake(utils.ResultType.SUCCESS);

      await mockToken.transfer(stakerAddress, stakeAmount, {from: accounts[0]});
      await baseToken.transfer(facilitator, bountyAmount, {from: accounts[0]});
      await mockToken.approve(gateway.address, stakeAmount, {from: stakerAddress});
      await baseToken.approve(gateway.address, bountyAmount, {from: facilitator});

      nonce = new BN(2);
      await _prepareData();
      errorMessage = "Previous process is not completed";
      await _stake(utils.ResultType.FAIL);

    });

    it('should fail when previous stake for same address is in revocation', async function() {

      await _prepareData();
      await _stake(utils.ResultType.SUCCESS);

      let penalty = new BN(bountyAmount * PENALTY_PERCENT);

      // funding staker for penalty amount
      await baseToken.transfer(stakerAddress, penalty, {from: accounts[0]});
      // approving gateway for penalty amount
      await baseToken.approve(gateway.address, penalty, {from: stakerAddress});

      //revertStaking
      await gateway.revertStaking(messageHash,{from: stakerAddress});

      await mockToken.transfer(stakerAddress, stakeAmount, {from: accounts[0]});
      await baseToken.transfer(facilitator, bountyAmount, {from: accounts[0]});
      await mockToken.approve(gateway.address, stakeAmount, {from: stakerAddress});
      await baseToken.approve(gateway.address, bountyAmount, {from: facilitator});

      nonce = new BN(2);
      await _prepareData();
      errorMessage = "Previous process is not completed";
      await _stake(utils.ResultType.FAIL);
    });

  });

});
