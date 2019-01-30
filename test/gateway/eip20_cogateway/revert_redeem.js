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
const BN = require('bn.js');

const MockUtilityToken = artifacts.require('MockUtilityToken');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../test_lib/utils.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const web3 = require('../../test_lib/web3.js');

const { MessageStatusEnum } = messageBus;
const zeroAddress = Utils.NULL_ADDRESS;
const zeroBytes = Utils.ZERO_BYTES32;
const PENALTY_MULTIPLIER = 1.5;

contract('EIP20CoGateway.revertRedeem()', (accounts) => {
  let constructorParams;
  let redeemParams;
  let utilityToken;
  let eip20CoGateway;

  beforeEach(async () => {
    constructorParams = {
      valueToken: accounts[9],
      stateRootProvider: accounts[3],
      bounty: new BN(100),
      organization: accounts[9],
      gateway: accounts[4],
      burner: zeroAddress,
      owner: accounts[0],
    };

    utilityToken = await MockUtilityToken.new(
      constructorParams.valueToken, // Token address.
      'DMY', // Symbol.
      'Dummy token', // Token name.
      18, // Token decimal.
      constructorParams.organization, // Organisation address.
      { from: constructorParams.owner },
    );

    constructorParams.utilityToken = utilityToken.address;

    eip20CoGateway = await EIP20CoGateway.new(
      constructorParams.valueToken,
      constructorParams.utilityToken,
      constructorParams.stateRootProvider,
      constructorParams.bounty,
      constructorParams.organization,
      constructorParams.gateway,
      constructorParams.burner,
    );

    const hashLockObj = Utils.generateHashLock();

    redeemParams = {
      amount: new BN(10000),
      beneficiary: accounts[5],
      gasPrice: new BN(1),
      gasLimit: new BN(1000),
      nonce: new BN(1),
      hashLock: hashLockObj.l,
      unlockSecret: hashLockObj,
      redeemer: accounts[2],
      intentHash: web3.utils.sha3('dummy'),
      penalty: constructorParams.bounty.muln(PENALTY_MULTIPLIER),
    };

    redeemParams.messageHash = messageBus.messageDigest(
      redeemParams.intentHash,
      redeemParams.nonce,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.redeemer,
      redeemParams.hashLock,
    );

    await eip20CoGateway.setMessage(
      redeemParams.intentHash,
      redeemParams.nonce,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.redeemer,
      redeemParams.hashLock,
    );

    await eip20CoGateway.setRedeem(
      redeemParams.messageHash,
      redeemParams.beneficiary,
      redeemParams.amount,
    );

    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.Declared,
    );
  });

  it('should fail when message hash is zero', async () => {
    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(zeroBytes, {
        from: redeemParams.redeemer,
        value: redeemParams.penalty,
      }),
      'Message hash must not be zero.',
    );
  });

  it('should fail when message is not declared', async () => {
    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.Undeclared,
    );

    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(redeemParams.messageHash, {
        from: redeemParams.redeemer,
        value: redeemParams.penalty,
      }),
      'Message on source must be Declared.',
    );
  });

  it('should fail when msg.sender is not redeemer address', async () => {
    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(redeemParams.messageHash, {
        from: constructorParams.owner,
        value: redeemParams.penalty,
      }),
      'Only redeemer can revert redeem.',
    );
  });

  it('should fail when msg.value is less than penalty amount', async () => {
    // Send less than the penalty amount in msg.value.
    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(redeemParams.messageHash, {
        from: redeemParams.redeemer,
        value: constructorParams.bounty.muln(PENALTY_MULTIPLIER - 0.1),
      }),
      'msg.value must match the penalty amount.',
    );
  });

  it('should fail when msg.value is greater than penalty amount', async () => {
    // Send greater than the penalty amount in msg.value.
    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(redeemParams.messageHash, {
        from: redeemParams.redeemer,
        value: constructorParams.bounty.muln(PENALTY_MULTIPLIER + 0.1),
      }),
      'msg.value must match the penalty amount.',
    );
  });

  it('should fail when message status is progressed', async () => {
    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.Progressed,
    );

    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(redeemParams.messageHash, {
        from: redeemParams.redeemer,
        value: redeemParams.penalty,
      }),
      'Message on source must be Declared.',
    );
  });

  it('should fail when message status is Declared revocation', async () => {
    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(redeemParams.messageHash, {
        from: redeemParams.redeemer,
        value: redeemParams.penalty,
      }),
      'Message on source must be Declared.',
    );
  });

  it('should fail when message status is Revoked', async () => {
    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      eip20CoGateway.revertRedeem(redeemParams.messageHash, {
        from: redeemParams.redeemer,
        value: redeemParams.penalty,
      }),
      'Message on source must be Declared.',
    );
  });

  it('should pass with correct params', async () => {
    const result = await eip20CoGateway.revertRedeem.call(
      redeemParams.messageHash,
      { from: redeemParams.redeemer, value: redeemParams.penalty },
    );

    assert.strictEqual(
      result.redeemer_,
      redeemParams.redeemer,
      `Redeemer address must be equal to ${redeemParams.staker}.`,
    );

    assert.strictEqual(
      result.redeemerNonce_.eq(redeemParams.nonce),
      true,
      `Redeemer nonce ${result.redeemerNonce_.toString(
        10,
      )} must be equal to ${redeemParams.nonce.toString(10)}.`,
    );

    assert.strictEqual(
      result.amount_.eq(redeemParams.amount),
      true,
      `Redeemer amount ${result.amount_.toString(
        10,
      )} must be equal to ${redeemParams.amount.toString(10)}.`,
    );

    await eip20CoGateway.revertRedeem(redeemParams.messageHash, {
      from: redeemParams.redeemer,
      value: redeemParams.penalty,
    });
  });

  it('should emit RevertRedeemDeclared event', async () => {
    const tx = await eip20CoGateway.revertRedeem(redeemParams.messageHash, {
      from: redeemParams.redeemer,
      value: redeemParams.penalty,
    });

    const event = EventDecoder.getEvents(tx, eip20CoGateway);
    const eventData = event.RevertRedeemDeclared;

    assert.isDefined(
      event.RevertRedeemDeclared,
      'Event `RevertRedeemDeclared` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      redeemParams.messageHash,
      `Message hash from the event must be equal to ${
        redeemParams.messageHash
      }.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      redeemParams.redeemer,
      `Redeemer address from the event must be equal to ${
        redeemParams.redeemer
      }.`,
    );

    assert.strictEqual(
      eventData._redeemerNonce.eq(redeemParams.nonce),
      true,
      `Redeemer nonce ${eventData._redeemerNonce.toString(
        10,
      )} from the event must be equal to ${redeemParams.nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._amount.eq(redeemParams.amount),
      true,
      `Redeem amount ${eventData._amount.toString(
        10,
      )} from the event must be equal to ${redeemParams.amount.toString(10)}.`,
    );
  });

  it('redeemer should pay the penalty', async () => {
    const eip20CoGatewayBaseBalance = await Utils.getBalance(
      eip20CoGateway.address,
    );

    const redeemerBaseBalance = await Utils.getBalance(redeemParams.redeemer);

    const eip20CoGatewayBalance = await utilityToken.balanceOf(
      eip20CoGateway.address,
    );
    const redeemerBalance = await utilityToken.balanceOf(
      redeemParams.redeemer,
    );

    const tx = await eip20CoGateway.revertRedeem(redeemParams.messageHash, {
      from: redeemParams.redeemer,
      value: redeemParams.penalty,
    });

    const eip20CoGatewayBaseFinalBalance = await Utils.getBalance(
      eip20CoGateway.address,
    );

    const redeemerBaseFinalBalance = await Utils.getBalance(
      redeemParams.redeemer,
    );

    const eip20CoGatewayFinalBalance = await utilityToken.balanceOf(
      eip20CoGateway.address,
    );
    const redeemerFinalBalance = await utilityToken.balanceOf(
      redeemParams.redeemer,
    );

    assert.strictEqual(
      eip20CoGatewayBaseFinalBalance.eq(
        eip20CoGatewayBaseBalance.add(redeemParams.penalty),
      ),
      true,
      `CoGateway base token balance ${eip20CoGatewayBaseFinalBalance.toString(
        10,
      )} must be equal to ${eip20CoGatewayBaseBalance
        .add(redeemParams.penalty)
        .toString(10)}.`,
    );

    assert.strictEqual(
      redeemerBaseFinalBalance.eq(
        redeemerBaseBalance.sub(redeemParams.penalty).subn(tx.receipt.gasUsed),
      ),
      true,
      `Redeemer's base token balance ${redeemerBaseFinalBalance.toString(
        10,
      )} must be equal to ${redeemerBaseBalance
        .sub(redeemParams.penalty)
        .subn(tx.receipt.gasUsed)
        .toString(10)}.`,
    );

    assert.strictEqual(
      redeemerFinalBalance.eq(redeemerBalance),
      true,
      `Redeemer's token balance ${redeemerFinalBalance.toString(
        10,
      )} must be equal to ${redeemerBalance.toString(10)}.`,
    );

    assert.strictEqual(
      eip20CoGatewayFinalBalance.eq(eip20CoGatewayBalance),
      true,
      `CoGateway's token balance ${eip20CoGatewayFinalBalance.toString(
        10,
      )} must be equal to ${eip20CoGatewayBalance.toString(10)}.`,
    );
  });
});
