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

const Gateway = artifacts.require('./TestEIP20Gateway.sol');
const MockOrganization = artifacts.require('MockOrganization.sol');
const MockToken = artifacts.require('MockToken');

const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;
contract('EIP20Gateway.progressStake()', (accounts) => {
  let gateway;
  let mockToken;
  let baseToken;
  const bountyAmount = new BN(100);

  const stakeRequest = {
    beneficiary: accounts[6],
    stakeAmount: new BN(100),
  };

  const stakeMessage = {
    intentHash: web3.utils.sha3('dummy'),
    stakerNonce: new BN(1),
    gasPrice: new BN(1),
    gasLimit: new BN(2),
    staker: accounts[8],
  };

  const { MessageStatusEnum } = messageBus;

  beforeEach(async () => {
    mockToken = await MockToken.new({ from: accounts[0] });
    baseToken = await MockToken.new({ from: accounts[0] });

    const owner = accounts[2];
    const worker = accounts[7];
    const organization = await MockOrganization.new(owner, worker);

    const coreAddress = accounts[5];
    const burner = NullAddress;

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      organization.address,
      burner,
    );

    await mockToken.transfer(gateway.address, new BN(10000), {
      from: accounts[0],
    });
    await baseToken.transfer(gateway.address, new BN(10000), {
      from: accounts[0],
    });

    const hashLockObj = Utils.generateHashLock();

    stakeMessage.hashLock = hashLockObj.l;
    stakeMessage.unlockSecret = hashLockObj.s;
    stakeMessage.messageHash = messageBus.messageDigest(
      stakeMessage.intentHash,
      stakeMessage.stakerNonce,
      stakeMessage.gasPrice,
      stakeMessage.gasLimit,
      stakeMessage.staker,
      stakeMessage.hashLock,
    );

    await gateway.setStake(
      stakeMessage.messageHash,
      stakeRequest.beneficiary,
      stakeRequest.stakeAmount,
    );
    await gateway.setMessage(
      stakeMessage.intentHash,
      stakeMessage.stakerNonce,
      stakeMessage.gasPrice,
      stakeMessage.gasLimit,
      stakeMessage.staker,
      stakeMessage.hashLock,
    );
  });

  it('should fail when messagehash is zero', async () => {
    const messageHash = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressStake(messageHash, stakeMessage.unlockSecret),
      'Message hash must not be zero.',
    );
  });

  it('should fail for wrong unlock secret ', async () => {
    const unlockSecret = ZeroBytes;

    await Utils.expectRevert(
      gateway.progressStake(stakeMessage.messageHash, unlockSecret),
      'Invalid unlock secret.',
    );
  });

  it('should fail for undeclared message', async () => {
    await Utils.expectRevert(
      gateway.progressStake(
        stakeMessage.messageHash,
        stakeMessage.unlockSecret,
      ),
      'Message on source must be Declared',
    );
  });

  it('should fail for revoked message', async () => {
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

  it('should fail for message with declared revocation status', async () => {
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

  it('should fail for already progressed message', async () => {
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

  it('should progress stake with correct param', async () => {
    const stakeVault = await gateway.stakeVault.call();
    const caller = accounts[6];

    const callerInitialBaseTokenBalance = await baseToken.balanceOf(caller);
    const gatewayInitialTokenBalance = await mockToken.balanceOf(
      gateway.address,
    );
    const gatewayInitialBaseTokenBalance = await baseToken.balanceOf(
      gateway.address,
    );
    const stakeVaultInitialTokenBalance = await mockToken.balanceOf(
      stakeVault,
    );

    await gateway.setOutboxStatus(
      stakeMessage.messageHash,
      MessageStatusEnum.Declared,
    );

    const result = await gateway.progressStake.call(
      stakeMessage.messageHash,
      stakeMessage.unlockSecret,
    );

    assert.strictEqual(
      result.staker_,
      stakeMessage.staker,
      'Staker address must match.',
    );
    assert.strictEqual(
      result.stakeAmount_.eq(stakeRequest.stakeAmount),
      true,
      'Stake amount must match.',
    );

    const tx = await gateway.progressStake(
      stakeMessage.messageHash,
      stakeMessage.unlockSecret,
      { from: caller },
    );

    const event = EventDecoder.getEvents(tx, gateway);
    const eventData = event.StakeProgressed;

    assert.equal(tx.receipt.status, 1, 'Receipt status is unsuccessful');
    assert.isDefined(
      event.StakeProgressed,
      'Event `StakeProgressed` must be emitted.',
    );
    assert.strictEqual(
      eventData._messageHash,
      stakeMessage.messageHash,
      'Message hash must match.',
    );
    assert.strictEqual(
      eventData._staker,
      stakeMessage.staker,
      'Staker address must match.',
    );
    assert.strictEqual(
      eventData._stakerNonce.eq(stakeMessage.stakerNonce),
      true,
      'Staker nonce must match.',
    );
    assert.strictEqual(
      eventData._amount.eq(stakeRequest.stakeAmount),
      true,
      'Stake amount must match.',
    );
    assert.strictEqual(
      eventData._proofProgress,
      false,
      'Proof progress flag should be false.',
    );
    assert.strictEqual(
      eventData._unlockSecret,
      stakeMessage.unlockSecret,
      'Unlock secret must match.',
    );

    const callerFinalBaseTokenBalance = await baseToken.balanceOf(caller);
    const gatewayFinalTokenBalance = await mockToken.balanceOf(
      gateway.address,
    );
    const gatewayFinalBaseTokenBalance = await baseToken.balanceOf(
      gateway.address,
    );
    const stakeVaultFinalTokenBalance = await mockToken.balanceOf(stakeVault);

    assert.strictEqual(
      callerFinalBaseTokenBalance.eq(
        callerInitialBaseTokenBalance.add(bountyAmount),
      ),
      true,
      'Bounty should be returned to caller.',
    );
    assert.strictEqual(
      gatewayFinalTokenBalance.eq(
        gatewayInitialTokenBalance.sub(stakeRequest.stakeAmount),
      ),
      true,
      'Gateway token balance should reduced by stake amount on successful'
        + ' progress stake.',
    );
    assert.strictEqual(
      gatewayFinalBaseTokenBalance.eq(
        gatewayInitialBaseTokenBalance.sub(bountyAmount),
      ),
      true,
      'Gateway base balance should reduced by bounty amount on successful'
        + ' progress stake.',
    );
    assert.strictEqual(
      stakeVaultFinalTokenBalance.eq(
        stakeVaultInitialTokenBalance.add(stakeRequest.stakeAmount),
      ),
      true,
      'Stake vault token balance should increase by stake amount on'
        + ' successful progress stake.',
    );
  });
});
