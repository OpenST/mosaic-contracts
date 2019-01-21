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

const EIP20CoGateway = artifacts.require('TestEIP20CoGateway'),
  BN = require('bn.js'),
  MockToken = artifacts.require('MockToken'),
  Utils = require("../../test_lib/utils.js"),
  messageBus = require('../../test_lib/message_bus.js'),
  coGatewayUtils = require('./helpers/co_gateway_utils.js');

let eip20CoGateway,
  burner,
  valueToken,
  dummyStateRootProvider,
  organization,
  gateway,
  utilityToken,
  bountyAmount,
  owner,
  redeemer,
  redeemerBalance;

let MessageStatusEnum = messageBus.MessageStatusEnum;

contract('EIP20CoGateway.redeem()', function (accounts) {

  let amount,
    beneficiary = accounts[4],
    gasPrice = new BN(1),
    gasLimit = new BN(1000),
    nonce = new BN(1),
    hashLockObj = Utils.generateHashLock(),
    hashLock = hashLockObj.l;

  beforeEach(async function () {

    valueToken = accounts[0];
    dummyStateRootProvider = accounts[1];
    organization = accounts[2];
    gateway = accounts[3];
    owner = accounts[8];
    utilityToken = await MockToken.new({ from: owner });
    bountyAmount = new BN(100);
    redeemer = accounts[7];
    redeemerBalance = new BN(100000);
    burner = accounts[10];

    eip20CoGateway = await EIP20CoGateway.new(
      valueToken,
      utilityToken.address,
      dummyStateRootProvider,
      bountyAmount,
      organization,
      gateway,
      burner
    );

    await utilityToken.transfer(redeemer, redeemerBalance, { from: owner });

    await utilityToken.approve(
      eip20CoGateway.address,
      redeemerBalance,
      { from: redeemer },
    );
    amount = redeemerBalance;

  });

  it('should fail when the bounty amount is less than expected bounty amount', async function () {

    let bounty = new BN(10);
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

  it('should fail when the bounty amount is more than expected bounty amount', async function () {

    let bounty = new BN(110);
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

  it('should fail when redeem amount is zero', async function () {

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

  it('should fail when max reward amount is greater than the redeem amount', async function () {

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

  it('should fail when redeem with same nonce is already initiated', async function () {

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

  it('should fail when previous redeem is in progress', async function () {

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

  it('should fail when cogateway is not approved with redeem amount', async function () {

    /*
     * CoGateway is approved to spend the redeem amount in beforeEach, so by
     * adding 1 to the approved(redeem) amount, the transfer will fail for this
     * test case.
     */
    let redeemAmount = amount.addn(1);

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
      "Underflow when subtracting.",
    );

  });

  it('should fail when the redeemer\'s base token balance is less than the bounty amount', async function () {

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
      "Payable amount should be equal to the bounty amount.",
    )
  });

  it('should fail when the redeemer\'s BT balance is less than the redeem amount', async function () {

    let redeemAmount = redeemerBalance.addn(1);

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
      "Underflow when subtracting.",
    )
  });

  it('should fail when the message status is progressed', async function () {

    let messageHash = await eip20CoGateway.redeem.call(
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
        { from: redeemer, value: bountyAmount }
      ),
      "Message on source must be Undeclared."
    );

  });

  it('should fail when the message status is declared revocation', async function () {

    let messageHash = await eip20CoGateway.redeem.call(
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
        { from: redeemer, value: bountyAmount }
      ),
      "Message on source must be Undeclared."
    );

  });

  it('should fail when the message status is declared', async function () {

    let messageHash = await eip20CoGateway.redeem.call(
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
        { from: redeemer, value: bountyAmount }
      ),
      "Message on source must be Undeclared."
    );

  });

  it('should fail when the message status is revoked', async function () {

    let messageHash = await eip20CoGateway.redeem.call(
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
        { from: redeemer, value: bountyAmount }
      ),
      "Message on source must be Undeclared."
    );

  });

  it('should fail if the previous process is in revocation declared state', async function () {

    let messageHash = await eip20CoGateway.redeem.call(
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
      'Previous process is not completed.'
    );

  });


  it('should successfully redeem', async function () {

    let intentHash = coGatewayUtils.hashRedeemIntent(
      amount,
      beneficiary,
      eip20CoGateway.address,
    );

    let expectedMessageHash = messageBus.messageDigest(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      redeemer,
      hashLock,
    );

    let actualMessageHash = await eip20CoGateway.redeem.call(
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
      "Incorrect messageHash from contract",
    );

    let response = await eip20CoGateway.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      { from: redeemer, value: bountyAmount },
    );

    let eip20CoGatewayBaseBalance = new BN(
      await web3.eth.getBalance(eip20CoGateway.address),
    );

    assert.strictEqual(
      bountyAmount.eq(eip20CoGatewayBaseBalance),
      true,
      "Bounty is not transferred to CoGateway",
    );

    let eip20CoGatewayBalance = await utilityToken.balanceOf(eip20CoGateway.address);

    assert.strictEqual(
      eip20CoGatewayBalance.eq(amount),
      true,
      "EIP20CoGateway address did not receive redeemed amount",
    );

    let expectedBalance = redeemerBalance.sub(amount);
    let redeemerTokenBalance = await utilityToken.balanceOf(redeemer);
    assert.strictEqual(
      redeemerTokenBalance.eq(expectedBalance),
      true,
      `Redeemer's EIP20 token balance ${redeemerTokenBalance} should be equal to ${expectedBalance}`,
    );

    let expectedEvent = {
      RedeemIntentDeclared: {
        _messageHash: expectedMessageHash,
        _redeemer: redeemer,
        _redeemerNonce: nonce,
        _beneficiary: beneficiary,
        _amount: amount
      }
    };

    assert.equal(
      response.receipt.status,
      1,
      "Receipt status is unsuccessful"
    );

    let eventData = response.logs;
    await Utils.validateEvents(eventData, expectedEvent);

  });

});

