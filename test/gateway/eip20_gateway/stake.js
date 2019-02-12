// Copyright 2019 OpenST Ltd.
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

const BN = require('bn.js');
const utils = require('../../test_lib/utils');
const GatewayUtils = require('./helpers/gateway_utils');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../test_lib/utils.js');

const Gateway = artifacts.require('EIP20Gateway');
const MockToken = artifacts.require('MockToken');
const MockOrganization = artifacts.require('MockOrganization');

const PENALTY_PERCENT = 1.5;
const NullAddress = Utils.NULL_ADDRESS;
const burner = NullAddress;

let stakeAmount;
let beneficiary;
let stakerAddress;
let gasPrice;
let gasLimit;
let nonce;
let hashLock;
let messageHash;
let bountyAmount;
let mockToken;
let baseToken;
let organization;
let gateway;
let coGateway;
let core;
let hashLockObj;
let gatewayUtils;
let errorMessage;
let mockOrganization;

async function prepareData() {
  const intentHash = GatewayUtils.hashStakeIntent(
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
  const params = {
    amount: stakeAmount,
    beneficiary,
    staker: stakerAddress,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
  };

  const expectedResult = {
    returns: { messageHash },
    events: {
      StakeIntentDeclared: {
        _messageHash: messageHash,
        _staker: stakerAddress,
        _stakerNonce: nonce,
        _beneficiary: beneficiary,
        _amount: stakeAmount,
      },
    },
    errorMessage,
  };

  const txOption = {
    from: stakerAddress,
  };

  await gatewayUtils.stake(
    params,
    resultType,
    expectedResult,
    txOption,
  );
}

contract('EIP20Gateway.stake() ', (accounts) => {
  beforeEach(async () => {
    [core, stakerAddress, beneficiary, coGateway, organization] = accounts;

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

    nonce = await gatewayUtils.getNonce(accounts[1]);
    stakeAmount = new BN(100000000000);
    gasPrice = new BN(200);
    gasLimit = new BN(900000);
    hashLock = hashLockObj.l;


    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });

    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    errorMessage = '';
  });

  it('should successfully stake', async () => {
    await prepareData();
    await stake(utils.ResultType.SUCCESS);
  });

  it('should increase the nonce by 1 when staking', async () => {
    const nonceBefore = await gateway.getNonce.call(stakerAddress);
    await prepareData();
    await stake(utils.ResultType.SUCCESS);
    const nonceAfter = await gateway.getNonce.call(stakerAddress);

    assert.strictEqual(
      nonceBefore.addn(1).eq(nonceAfter),
      true,
      'The nonce should increase by one when staking. '
      + `Instead, it is ${nonceBefore.toString(10)} before and ${nonceAfter.toString(10)} after.`,
    );
  });

  it('should fail to stake when stake amount is 0', async () => {
    stakeAmount = new BN(0);
    errorMessage = 'Stake amount must not be zero.';
    await prepareData();
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when beneficiary address is 0', async () => {
    beneficiary = Utils.NULL_ADDRESS;
    errorMessage = 'Beneficiary address must not be zero.';
    await prepareData();
    await stake(utils.ResultType.FAIL);
  });

  it('should fail when max reward amount is greater than the stake amount', async () => {
    /*
    * Max reward amount will be `gasPrice * gasLimit`.
    * i.e. in this case its 180000000, which is higher than the stake amount.
    */
    stakeAmount = new BN(200);
    await prepareData();
    errorMessage = 'Maximum possible reward must be less than the stake amount.';
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when staker has balance less than the stake amount', async () => {
    stakeAmount = new BN(200000000000);
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await prepareData();
    errorMessage = 'revert';
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when stakerAddress has balance less than the bounty amount', async () => {
    await baseToken.transfer(accounts[0], new BN(50), { from: stakerAddress });
    await prepareData();
    errorMessage = 'revert';
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when gateway is not approved by the staker', async () => {
    stakerAddress = accounts[5];
    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await prepareData();
    errorMessage = 'revert';
    await stake(utils.ResultType.FAIL);
  });

  it('should fail when its already staked with same data (replay attack)', async () => {
    await prepareData();
    await stake(utils.ResultType.SUCCESS);

    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    errorMessage = 'Invalid nonce';
    await stake(utils.ResultType.FAIL);
  });

  it('should fail to stake when previous stake for same address is not progressed', async () => {
    await prepareData();
    await stake(utils.ResultType.SUCCESS);

    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    nonce = new BN(2);
    await prepareData();
    errorMessage = 'Previous process is not completed';
    await stake(utils.ResultType.FAIL);
  });

  it('should fail when previous stake for same address is in revocation', async () => {
    await prepareData();
    await stake(utils.ResultType.SUCCESS);

    const penalty = new BN(bountyAmount * PENALTY_PERCENT);

    // funding staker for penalty amount
    await baseToken.transfer(stakerAddress, penalty, { from: accounts[0] });
    // approving gateway for penalty amount
    await baseToken.approve(gateway.address, penalty, { from: stakerAddress });

    // revertStaking
    await gateway.revertStake(messageHash, { from: stakerAddress });

    await mockToken.transfer(stakerAddress, stakeAmount, { from: accounts[0] });
    await baseToken.transfer(stakerAddress, bountyAmount, { from: accounts[0] });
    await mockToken.approve(gateway.address, stakeAmount, { from: stakerAddress });
    await baseToken.approve(gateway.address, bountyAmount, { from: stakerAddress });

    nonce = new BN(2);
    await prepareData();
    errorMessage = 'Previous process is not completed';
    await stake(utils.ResultType.FAIL);
  });

  it('should fail stake if gateway is not activated.', async () => {
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
