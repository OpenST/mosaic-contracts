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

const EIP20CoGateway = artifacts.require('TestEIP20CoGateway');
const MockUtilityToken = artifacts.require('MockUtilityToken');

const BN = require('bn.js');

const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../test_lib/utils.js');
const web3 = require('../../test_lib/web3.js');
const EventDecoder = require('../../test_lib/event_decoder');

const { MessageStatusEnum } = messageBus;
contract('EIP20CoGateway.progressRedeem() ', (accounts) => {
  const amount = new BN(100);
  const beneficiary = accounts[4];
  const bountyAmount = new BN(100);

  let facilitator;
  let unlockSecret;
  let eip20CoGateway;
  let messageHash;
  let utilityToken;
  let sender;
  let nonce;

  beforeEach(async () => {
    const gasPrice = new BN(10);
    const gasLimit = new BN(10);
    const hashLockObj = Utils.generateHashLock();
    const hashLock = hashLockObj.l;
    const owner = accounts[8];
    const intentHash = web3.utils.sha3('dummy');

    facilitator = accounts[1];
    sender = owner;
    unlockSecret = hashLockObj.s;
    nonce = new BN(1);
    utilityToken = await MockUtilityToken.new(
      accounts[9],
      '',
      '',
      18,
      accounts[2], // organization,
      { from: owner },
    );

    eip20CoGateway = await EIP20CoGateway.new(
      accounts[0], // value token
      utilityToken.address,
      accounts[1], // state root provider
      bountyAmount,
      accounts[2], // organization
      accounts[3], // gateway
      accounts[10], // burner
    );

    messageHash = await eip20CoGateway.setMessage.call(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      sender,
      hashLock,
    );
    await eip20CoGateway.setMessage(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      sender,
      hashLock,
    );
    await eip20CoGateway.setRedeem(messageHash, beneficiary, amount);
    // Set co-gateway to owner so that increase supply can be called.
    await utilityToken.setCoGatewayAddress(owner);
    // Send redeem amount to co-gateway.
    await utilityToken.increaseSupply(eip20CoGateway.address, amount, {
      from: owner,
    });
    // Send bounty to co-gateway.
    await web3.eth.sendTransaction({
      to: eip20CoGateway.address,
      from: facilitator,
      value: bountyAmount,
    });
    await utilityToken.setCoGatewayAddress(eip20CoGateway.address);
  });

  it('should emit event on progress redeem', async () => {
    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    const tx = await eip20CoGateway.progressRedeem(messageHash, unlockSecret);

    const event = EventDecoder.getEvents(tx, eip20CoGateway);
    const eventData = event.RedeemProgressed;

    assert.equal(tx.receipt.status, 1, 'Receipt status is unsuccessful');
    assert.isDefined(
      event.RedeemProgressed,
      'Event `RedeemProgressed` must be emitted.',
    );
    assert.strictEqual(
      eventData._messageHash,
      messageHash,
      `Actual message hash ${
        eventData._messageHash
      } from event is not equal to expected message hash ${messageHash}`,
    );
    assert.strictEqual(
      eventData._redeemer,
      sender,
      `Actual redeemer ${
        eventData._redeemer
      } from event is not equal to expected redeemer ${sender}`,
    );
    assert.strictEqual(
      eventData._redeemerNonce.eq(nonce),
      true,
      `Actual redeemer nonce ${
        eventData._redeemerNonce
      } from event is not equal to expected redeemer nonce ${nonce}`,
    );
    assert.strictEqual(
      eventData._amount.eq(amount),
      true,
      `Actual amount ${
        eventData._amount
      } from event is not equal to expected amount ${amount}`,
    );
    assert.strictEqual(
      eventData._proofProgress,
      false,
      'Proof progress flag from event should be false.',
    );
    assert.strictEqual(
      eventData._unlockSecret,
      unlockSecret,
      `Actual unlockSecret ${
        eventData._unlockSecret
      } from event is not equal to expected unlockSecret ${unlockSecret}`,
    );
  });

  it('should return bounty to the facilitator', async () => {
    facilitator = accounts[8];
    const initialFacilitatorEthBalance = await Utils.getBalance(facilitator);
    const initialCoGatewayEthBalance = await Utils.getBalance(
      eip20CoGateway.address,
    );

    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    const tx = await eip20CoGateway.progressRedeem(messageHash, unlockSecret, {
      from: facilitator,
    });

    const finalFacilitatorEthBalance = await Utils.getBalance(facilitator);
    const finalCoGatewayEthBalance = await Utils.getBalance(
      eip20CoGateway.address,
    );

    const expectedFinalFacilitatorETHBalance = initialFacilitatorEthBalance
      .add(bountyAmount)
      .subn(tx.receipt.gasUsed);

    assert.strictEqual(
      finalFacilitatorEthBalance.eq(expectedFinalFacilitatorETHBalance),
      true,
      'Bounty should be return to facilitator.',
    );
    assert.strictEqual(
      finalCoGatewayEthBalance.eq(
        initialCoGatewayEthBalance.sub(bountyAmount),
      ),
      true,
      'Bounty should be transferred from co-gateway.',
    );
  });

  it('should decrease token supply for utility token', async () => {
    const initialTotalSupply = await utilityToken.totalSupply.call();
    const initialCoGatewayBalance = await utilityToken.balanceOf(
      eip20CoGateway.address,
    );

    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    await eip20CoGateway.progressRedeem(messageHash, unlockSecret);

    const finalTotalSupply = await utilityToken.totalSupply.call();
    const finalCoGatewayBalance = await utilityToken.balanceOf(
      eip20CoGateway.address,
    );

    assert.strictEqual(
      finalTotalSupply.eq(initialTotalSupply.sub(amount)),
      true,
      'Total supply should be reduced after progressRedeem.',
    );

    assert.strictEqual(
      finalCoGatewayBalance.eq(initialCoGatewayBalance.sub(amount)),
      true,
      'Co-gateway balance should be reduced.',
    );
  });

  it('should fail if redeem is already progressed', async () => {
    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    await eip20CoGateway.progressRedeem(messageHash, unlockSecret);

    await Utils.expectRevert(
      eip20CoGateway.progressRedeem(messageHash, unlockSecret),
      'Message on source must be Declared.',
    );
  });

  it('should fail for wrong unlock secret', async () => {
    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    await Utils.expectRevert(
      eip20CoGateway.progressRedeem(
        messageHash,
        web3.utils.sha3('wrong unlock secret'),
      ),
      'Invalid unlock secret.',
    );
  });

  it('should fail with null message hash', async () => {
    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    await Utils.expectRevert(
      eip20CoGateway.progressRedeem(Utils.ZERO_BYTES32, unlockSecret),
      'Message hash must not be zero.',
    );
  });

  it('should fail for undeclared message', async () => {
    await Utils.expectRevert(
      eip20CoGateway.progressRedeem(messageHash, unlockSecret),
      'Message on source must be Declared',
    );
  });

  it('should fail for revoked message', async () => {
    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      eip20CoGateway.progressRedeem(messageHash, unlockSecret),
      'Message on source must be Declared',
    );
  });

  it('should fail for message with declared revocation status', async () => {
    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      eip20CoGateway.progressRedeem(messageHash, unlockSecret),
      'Message on source must be Declared',
    );
  });
});
