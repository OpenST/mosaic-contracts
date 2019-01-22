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

const Gateway = artifacts.require('EIP20Gateway'),
  MockToken = artifacts.require('MockToken'),
  MockOrganization = artifacts.require('MockOrganization');

const utils = require('../../test_lib/utils'),
  BN = require('bn.js'),
  GatewayUtils = require('./helpers/gateway_utils'),
  messageBus = require('../../test_lib/message_bus.js');
  Utils = require('../../test_lib/utils.js');

const PENALTY_PERCENT = 1.5;
const NullAddress = Utils.NULL_ADDRESS;

let stakeAmount,
  beneficiary,
  stakerAddress,
  gasPrice,
  gasLimit,
  nonce,
  hashLock,
  messageHash,
  bountyAmount;

let burner = NullAddress;

let mockToken,
  baseToken,
  organization,
  gateway,
  coGateway,
  core,
  hashLockObj,
  gatewayUtils,
  errorMessage;

async function prepareData() {
  let intentHash = gatewayUtils.hashStakeIntent(
    stakeAmount,
    beneficiary,
    gateway.address,
  );

  messageHash = messageBus.messageDigest(
    intentHash,
    nonce,
    gasPrice,
    gasLimit,
    stakerAddress,
    hashLock,
  );
}

async function stake(resultType) {

  let params = {
    amount: stakeAmount,
    beneficiary: beneficiary,
    staker: stakerAddress,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    nonce: nonce,
    hashLock: hashLock
  };

  let expectedResult = {
    returns: { messageHash: messageHash },
    events: {
      StakeIntentDeclared: {
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
    from: stakerAddress
  };

  await gatewayUtils.stake(
    params,
    resultType,
    expectedResult,
    txOption
  );
}

contract('EIP20Gateway.stake() ', function (accounts) {

  beforeEach(async function () {

    coGateway = accounts[7];
    core = accounts[1];
    organization = accounts[8];

    mockToken = await MockToken.new();
    baseToken = await MockToken.new();
    mockOrganization = await MockOrganization.new(organization, organization);

    bountyAmount = new BN(100);
    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      core,
      bountyAmount,
      mockOrganization.address,
      burner,
    );
    await gateway.activateGateway(coGateway, { from: organization });

    gatewayUtils = new GatewayUtils(gateway, mockToken, baseToken);

    hashLockObj = utils.generateHashLock();

    stakerAddress = accounts[4];
    nonce = await gatewayUtils.getNonce(accounts[1]);
    stakeAmount = new BN(100000000000);
    beneficiary = accounts[2];
    stakerAddress = accounts[1];
    gasPrice = new BN(200);
    gasLimit = new BN(900000);
    hashLock = hashLockObj.l;


    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });

    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    errorMessage = "";
  });

  it('should fail to stake when stake amount is 0', async function () {
    stakeAmount = new BN(0);
    errorMessage = "Stake amount must not be zero.";
    await prepareData();
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when beneficiary address is 0', async function () {
    beneficiary = Utils.NULL_ADDRESS;
    errorMessage = "Beneficiary address must not be zero.";
    await prepareData();
    await stake(utils.ResultType.FAIL);
  });

  it('should fail when max reward amount is greater than the stake amount', async function () {
    /*
     * Max reward amount will be `gasPrice * gasLimit`.
     * i.e. in this case its 180000000, which is higher than the stake amount.
     */
    stakeAmount = new BN(200);
    await prepareData();
    errorMessage = "Maximum possible reward must be less than the stake amount.";
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when staker has balance less than the stake amount', async function () {
    stakeAmount = new BN(200000000000);
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await prepareData();
    errorMessage = "revert";
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when stakerAddress has balance less than the bounty amount', async function () {
    await baseToken.transfer(accounts[0], new BN(50), { from: stakerAddress });
    await prepareData();
    errorMessage = "revert";
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when gateway is not approved by the staker', async function () {
    stakerAddress = accounts[5];
    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await prepareData();
    errorMessage = "revert";
    await stake(utils.ResultType.FAIL);
  });

  it('should successfully stake', async function () {
    await prepareData();
    await stake(utils.ResultType.SUCCESS);
  });

  it('should fail when its already staked with same data (replay attack)', async function () {

    await prepareData();
    await stake(utils.ResultType.SUCCESS);

    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    errorMessage = "Invalid nonce";
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when previous stake for same address is not progressed', async function () {

    await prepareData();
    await stake(utils.ResultType.SUCCESS);

    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    nonce = new BN(2);
    await prepareData();
    errorMessage = "Previous process is not completed";
    await stake(utils.ResultType.FAIL);

  });

  it('should fail when previous stake for same address is in revocation', async function () {

    await prepareData();
    await stake(utils.ResultType.SUCCESS);

    let penalty = new BN(bountyAmount * PENALTY_PERCENT);

    // funding staker for penalty amount
    await baseToken.transfer(stakerAddress, penalty, { from: accounts[0] });
    // approving gateway for penalty amount
    await baseToken.approve(gateway.address, penalty, { from: stakerAddress });

    //revertStaking
    await gateway.revertStake(messageHash, { from: stakerAddress });

    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    nonce = new BN(2);
    await prepareData();
    errorMessage = "Previous process is not completed";
    await stake(utils.ResultType.FAIL);
  });

  it('should fail stake if gateway is not activated.', async function () {

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      core,
      bountyAmount,
      mockOrganization.address,
      burner,
    );

    /*
     * New utils, because the gateway is a new one and the old utils still
     * have the old gateway registered.
     */
    gatewayUtils = new GatewayUtils(gateway, mockToken, baseToken);
    await prepareData();

    await stake(utils.ResultType.FAIL);
  });

});
