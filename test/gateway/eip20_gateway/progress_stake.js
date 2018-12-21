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
const MockMembersManager = artifacts.require('MockMembersManager.sol');
const MockToken = artifacts.require("MockToken");

const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const GatewayHelper = require("./helpers/helper");

const NullAddress = "0x0000000000000000000000000000000000000000";
const ZeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000";
contract('EIP20Gateway.progressStake()', function (accounts) {

  let gateway;
  let mockToken, baseToken;
  let bountyAmount = new BN(100);
  let gatewayHelper = new GatewayHelper();

  let stakeRequest = {
    beneficiary: accounts[6],
    stakeAmount: new BN(100),
  };

  let stakeMessage = {
    intentHash: web3.utils.sha3("dummy"),
    stakerNonce: new BN(1),
    gasPrice: new BN(1),
    gasLimit: new BN(2),
    staker: accounts[8],
  };

  let MessageStatusEnum = {
    Undeclared: 0,
    Declared: 1,
    Progressed: 2,
    DeclaredRevocation: 3,
    Revoked: 4,
  };

  beforeEach(async function () {

    mockToken = await MockToken.new({from: accounts[0]});
    baseToken = await MockToken.new({from: accounts[0]});

    let owner = accounts[2];
    let worker = accounts[7];
    let membersManager = await MockMembersManager.new(owner, worker);

    let coreAddress = accounts[5];
    let burner = NullAddress;

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      membersManager.address,
      burner,
    );

    await mockToken.transfer(gateway.address, new BN(10000), {from: accounts[0]});
    await baseToken.transfer(gateway.address, new BN(10000), {from: accounts[0]});

    let hashLockObj = Utils.generateHashLock();

    stakeMessage.hashLock = hashLockObj.l;
    stakeMessage.unlockSecret = hashLockObj.s;
    let stakeTypeHash = await  gatewayHelper.stakeTypeHash();
    stakeMessage.messageHash = Utils.messageHash(
      stakeTypeHash,
      stakeMessage.intentHash,
      stakeMessage.stakerNonce,
      stakeMessage.gasPrice,
      stakeMessage.gasLimit,
    );

    await gateway.setStake(
      stakeMessage.messageHash,
      stakeRequest.beneficiary,
      stakeRequest.stakeAmount,
    );
    await gateway.setStakeMessage(
      stakeMessage.messageHash,
      stakeMessage.intentHash,
      stakeMessage.stakerNonce,
      stakeMessage.gasPrice,
      stakeMessage.gasLimit,
      stakeMessage.hashLock,
      stakeMessage.staker,
    );

  });

  it('should fail when messagehash is zero', async function () {

    let messageHash = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressStake(
        messageHash,
        stakeMessage.unlockSecret,
      ),
      'Message hash must not be zero.',
    );

  });

  it('should fail for wrong unlock secret ', async function () {

    let unlockSecret = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressStake(
        stakeMessage.messageHash,
        unlockSecret,
      ),
      'Invalid unlock secret.',
    );

  });

  it('should fail for undeclared message', async function () {

    await Utils.expectRevert(
      gateway.progressStake(
        stakeMessage.messageHash,
        stakeMessage.unlockSecret,
      ),
      'Message on source must be Declared',
    );

  });

  it('should fail for revoked message', async function () {

    await gateway.setOutboxStatus(
      stakeMessage.messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      gateway.progressStake(
        stakeMessage.messageHash,
        stakeMessage.unlockSecret,
      ),
      'Message on source must be Declared',
    );

  });

  it('should fail for message with declared revocation status', async function () {

    await gateway.setOutboxStatus(
      stakeMessage.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      gateway.progressStake(
        stakeMessage.messageHash,
        stakeMessage.unlockSecret,
      ),
      'Message on source must be Declared',
    );

  });

  it('should fail for already progressed message', async function () {

    await gateway.setOutboxStatus(
      stakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    await gateway.progressStake(
      stakeMessage.messageHash,
      stakeMessage.unlockSecret,
    );
    await Utils.expectRevert(
      gateway.progressStake(
        stakeMessage.messageHash,
        stakeMessage.unlockSecret,
      ),
      'Message on source must be Declared.',
    );
  });

  it('should progress stake with correct param', async function () {

    let stakeVault = await gateway.stakeVault.call();
    let caller = accounts[6];

    let callerInitialBaseTokenBalance = await baseToken.balanceOf(caller);
    let gatewayInitialTokenBalance = await mockToken.balanceOf(gateway.address);
    let gatewayInitialBaseTokenBalance = await baseToken.balanceOf(gateway.address);
    let stakeVaultInitialTokenBalance = await mockToken.balanceOf(stakeVault);

    await gateway.setOutboxStatus(
      stakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    let result = await gateway.progressStake.call(
      stakeMessage.messageHash,
      stakeMessage.unlockSecret,
    );

    assert.strictEqual(
      result.staker_,
      stakeMessage.staker,
      `Staker address must match.`,
    );
    assert.strictEqual(
      result.stakeAmount_.eq(stakeRequest.stakeAmount),
      true,
      `Stake amount must match.`,
    );

    let tx = await gateway.progressStake(
      stakeMessage.messageHash,
      stakeMessage.unlockSecret,
      {from: caller}
    );

    let event = EventDecoder.getEvents(tx, gateway);
    let eventData = event.StakeProgressed;

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );
    assert.isDefined(
      event.StakeProgressed,
      'Event `StakeProgressed` must be emitted.',
    );
    assert.strictEqual(
      eventData._messageHash,
      stakeMessage.messageHash,
      `Message hash must match.`,
    );
    assert.strictEqual(
      eventData._staker,
      stakeMessage.staker,
      `Staker address must match.`,
    );
    assert.strictEqual(
      eventData._stakerNonce.eq(stakeMessage.stakerNonce),
      true,
      `Staker nonce must match.`,
    );
    assert.strictEqual(
      eventData._amount.eq(stakeRequest.stakeAmount),
      true,
      `Stake amount must match.`,
    );
    assert.strictEqual(
      eventData._proofProgress,
      false,
      `Proof progress flag should be false.`,
    );
    assert.strictEqual(
      eventData._unlockSecret,
      stakeMessage.unlockSecret,
      `Unlock secret must match.`,
    );

    let callerFinalBaseTokenBalance = await baseToken.balanceOf(caller);
    let gatewayFinalTokenBalance = await mockToken.balanceOf(gateway.address);
    let gatewayFinalBaseTokenBalance = await baseToken.balanceOf(gateway.address);
    let stakeVaultFinalTokenBalance = await mockToken.balanceOf(stakeVault);

    assert.strictEqual(
      callerFinalBaseTokenBalance.eq(callerInitialBaseTokenBalance.add(bountyAmount)),
      true,
      "Bounty should be returned to caller.",
    );
    assert.strictEqual(
      gatewayFinalTokenBalance.eq(gatewayInitialTokenBalance.sub(stakeRequest.stakeAmount)),
      true,
      "Gateway token balance should reduced by stake amount on successful" +
      " progress stake.",
    );
    assert.strictEqual(
      gatewayFinalBaseTokenBalance.eq(gatewayInitialBaseTokenBalance.sub(bountyAmount)),
      true,
      "Gateway base balance should reduced by bounty amount on successful" +
      " progress stake.",
    );
    assert.strictEqual(
      stakeVaultFinalTokenBalance.eq(stakeVaultInitialTokenBalance.add(stakeRequest.stakeAmount)),
      true,
      "Stake vault token balance should increase by stake amount on" +
      " successful progress stake.",
    );
  });

});
