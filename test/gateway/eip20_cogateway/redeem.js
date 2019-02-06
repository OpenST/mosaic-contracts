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
const Utils = require('../../test_lib/utils');
const messageBus = require('../../test_lib/message_bus.js');
const CoGatewayUtils = require('./helpers/co_gateway_utils.js');

const EIP20CoGateway = artifacts.require('TestEIP20CoGateway');
const MockToken = artifacts.require('MockToken');

const { MessageStatusEnum } = messageBus;

const nonce = new BN(1);
const hashLockObj = Utils.generateHashLock();
const hashLock = hashLockObj.l;

let eip20CoGateway;
let burner;
let valueToken;
let dummyStateRootProvider;
let organization;
let gateway;
let utilityToken;
let bountyAmount;
let owner;
let redeemer;
let beneficiary;
let redeemerBalance;
let amount;
let gasPrice = new BN(1);
let gasLimit = new BN(1000);

contract('EIP20CoGateway.redeem()', (accounts) => {
  beforeEach(async () => {
    [
      valueToken,
      dummyStateRootProvider,
      organization,
      gateway,
      beneficiary,
      redeemer,
      owner,
      burner,
    ] = accounts;

    utilityToken = await MockToken.new({ from: owner });
    bountyAmount = new BN(100);
    redeemerBalance = new BN(100000);

    eip20CoGateway = await EIP20CoGateway.new(
      valueToken,
      utilityToken.address,
      dummyStateRootProvider,
      bountyAmount,
      organization,
      gateway,
      burner,
    );

    await utilityToken.transfer(redeemer, redeemerBalance, { from: owner });

    await utilityToken.approve(
      eip20CoGateway.address,
      redeemerBalance,
      { from: redeemer },
    );
    amount = redeemerBalance;
  });

  it('should fail when the bounty amount is less than expected bounty amount', async () => {
    const bounty = new BN(10);
    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bounty },
      ),
      'Payable amount should be equal to the bounty amount.',
    );
  });

  it('should fail when the bounty amount is more than expected bounty amount', async () => {
    const bounty = new BN(110);
    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bounty },
      ),
      'Payable amount should be equal to the bounty amount.',
    );
  });

  it('should fail when redeem amount is zero', async () => {
    amount = new BN(0);

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Redeem amount must not be zero.',
    );
  });

  it('should fail when max reward amount is greater than the redeem amount', async () => {
    amount = new BN(100);
    gasPrice = new BN(1);
    gasLimit = new BN(10000);

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Maximum possible reward must be less than the redeem amount.',
    );
  });

  it('should fail when redeem with same nonce is already initiated', async () => {
    await eip20CoGateway.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    amount = new BN(200000);
    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Invalid nonce.',
    );
  });

  it('should fail when previous redeem is in progress', async () => {
    await eip20CoGateway.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce.addn(1),
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Previous process is not completed.',
    );
  });

  it('should fail when cogateway is not approved with redeem amount', async () => {
    /*
         * CoGateway is approved to spend the redeem amount in beforeEach, so by
         * adding 1 to the approved(redeem) amount, the transfer will fail for this
         * test case.
         */
    const redeemAmount = amount.addn(1);

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        redeemAmount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Underflow when subtracting.',
    );
  });

  it('should fail when the redeemer\'s base token balance is less than the bounty amount', async () => {
    bountyAmount = new BN(10);
    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Payable amount should be equal to the bounty amount.',
    );
  });

  it('should fail when the redeemer\'s BT balance is less than the redeem amount', async () => {
    const redeemAmount = redeemerBalance.addn(1);

    await utilityToken.approve(
      eip20CoGateway.address,
      redeemAmount,
      { from: redeemer },
    );

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        redeemAmount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Underflow when subtracting.',
    );
  });

  it('should fail when the message status is progressed', async () => {
    const messageHash = await eip20CoGateway.redeem.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Progressed,
    );

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Message on source must be Undeclared',
    );
  });

  it('should fail when the message status is declared revocation', async () => {
    const messageHash = await eip20CoGateway.redeem.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Message on source must be Undeclared.',
    );
  });

  it('should fail when the message status is declared', async () => {
    const messageHash = await eip20CoGateway.redeem.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Message on source must be Undeclared.',
    );
  });

  it('should fail when the message status is revoked', async () => {
    const messageHash = await eip20CoGateway.redeem.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Message on source must be Undeclared.',
    );
  });

  it('should fail if the previous process is in revocation declared state', async () => {
    const messageHash = await eip20CoGateway.redeem.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    await eip20CoGateway.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    await eip20CoGateway.setOutboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    Utils.expectRevert(
      eip20CoGateway.redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce.addn(1),
        hashLock,
        { from: redeemer, value: bountyAmount },
      ),
      'Previous process is not completed.',
    );
  });

  it('should successfully redeem', async () => {
    const intentHash = CoGatewayUtils.hashRedeemIntent(
      amount,
      beneficiary,
      eip20CoGateway.address,
    );

    const expectedMessageHash = messageBus.messageDigest(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      redeemer,
      hashLock,
    );

    const actualMessageHash = await eip20CoGateway.redeem.call(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    assert.strictEqual(
      actualMessageHash,
      expectedMessageHash,
      'Incorrect messageHash from contract',
    );

    const response = await eip20CoGateway.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    const eip20CoGatewayBaseBalance = new BN(
      await web3.eth.getBalance(eip20CoGateway.address),
    );

    assert.strictEqual(
      bountyAmount.eq(eip20CoGatewayBaseBalance),
      true,
      'Bounty is not transferred to CoGateway',
    );

    const eip20CoGatewayBalance = await utilityToken.balanceOf(eip20CoGateway.address);

    assert.strictEqual(
      eip20CoGatewayBalance.eq(amount),
      true,
      'EIP20CoGateway address did not receive redeemed amount',
    );

    const expectedBalance = redeemerBalance.sub(amount);
    const redeemerTokenBalance = await utilityToken.balanceOf(redeemer);
    assert.strictEqual(
      redeemerTokenBalance.eq(expectedBalance),
      true,
      `Redeemer's EIP20 token balance ${redeemerTokenBalance} should be equal to ${expectedBalance}`,
    );

    const expectedEvent = {
      RedeemIntentDeclared: {
        _messageHash: expectedMessageHash,
        _redeemer: redeemer,
        _redeemerNonce: nonce,
        _beneficiary: beneficiary,
        _amount: amount,
      },
    };

    assert.equal(
      response.receipt.status,
      1,
      'Receipt status is unsuccessful',
    );

    const eventData = response.logs;
    await Utils.validateEvents(eventData, expectedEvent);
  });

  it('should increase the nonce by 1 when redeeming', async () => {
    const nonceBefore = await eip20CoGateway.getNonce.call(redeemer);
    await eip20CoGateway.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );
    const nonceAfter = await eip20CoGateway.getNonce.call(redeemer);

    assert.strictEqual(
      nonceBefore.addn(1).eq(nonceAfter),
      true,
      'The nonce should increase by one when redeeming. '
            + `Instead, it is ${nonceBefore.toString(10)} before and ${nonceAfter.toString(10)} after.`,
    );
  });
});
