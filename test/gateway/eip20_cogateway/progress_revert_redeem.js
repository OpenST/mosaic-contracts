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


const EIP20CoGateway = artifacts.require("TestEIP20CoGateway");
const MockUtilityToken = artifacts.require("MockUtilityToken");
const BN = require("bn.js");

const messageBus = require('../../test_lib/message_bus.js');
const Utils = require("../../test_lib/utils.js");
const web3 = require("../../test_lib/web3.js");
const EventDecoder = require("../../test_lib/event_decoder");
const coGatewayUtils = require('./helpers/co_gateway_utils.js');
const StubData = require("../../../test/data/redeem_revoked_1.json");

const ZeroBytes = Utils.ZERO_BYTES32;
const MessageStatusEnum = messageBus.MessageStatusEnum;

contract('EIP20CoGateway.progressRevertRedeem() ', function (accounts) {

  let utilityToken, cogateway, revertRedeemParams, bountyAmount, penaltyAmount,
    owner,
    facilitator;

  beforeEach(async function () {

    owner = accounts[0];
    facilitator = accounts[1];

    revertRedeemParams = {
      redeemer: StubData.co_gateway.redeem.params.redeemer,
      amount: new BN(StubData.co_gateway.redeem.params.amount, 16),
      beneficiary: StubData.co_gateway.redeem.params.beneficiary,
      gasPrice: new BN(StubData.co_gateway.redeem.params.gasPrice, 16),
      gasLimit: new BN(StubData.co_gateway.redeem.params.gasLimit, 16),
      nonce: new BN(StubData.co_gateway.redeem.params.nonce, 16),
      hashLock: StubData.co_gateway.redeem.params.hashLock,
      rlpParentNodes: StubData.gateway.confirm_revert_redeem_intent.proof_data.storageProof[0].serializedProof,
      blockHeight: new BN(StubData.gateway.confirm_revert_redeem_intent.proof_data.block_number, 16),
      storageRoot: StubData.gateway.confirm_revert_redeem_intent.proof_data.storageHash,
      messageStatus: MessageStatusEnum.Declared
    };

    utilityToken = await MockUtilityToken.new(
      accounts[9],
      "",
      "",
      18,
      accounts[2],
      {from: owner}
    );

    bountyAmount = new BN(StubData.co_gateway.constructor.bounty);
    penaltyAmount = bountyAmount.muln(1.5);

    cogateway = await EIP20CoGateway.new(
      StubData.co_gateway.constructor.valueToken,
      utilityToken.address,
      StubData.co_gateway.constructor.stateRootProvider,
      bountyAmount,
      StubData.co_gateway.constructor.organization,
      StubData.co_gateway.constructor.gateway,
      accounts[8] //burner,
    );

    let redeemIntentHash = coGatewayUtils.hashRedeemIntent(
      revertRedeemParams.amount,
      revertRedeemParams.beneficiary,
      StubData.contracts.coGateway,
    );

    let messageHash = await cogateway.setMessage.call(
      redeemIntentHash,
      revertRedeemParams.nonce,
      revertRedeemParams.gasPrice,
      revertRedeemParams.gasLimit,
      revertRedeemParams.redeemer,
      revertRedeemParams.hashLock,
    );
    await cogateway.setMessage(
      redeemIntentHash,
      revertRedeemParams.nonce,
      revertRedeemParams.gasPrice,
      revertRedeemParams.gasLimit,
      revertRedeemParams.redeemer,
      revertRedeemParams.hashLock,
    );
    revertRedeemParams.messageHash = messageHash;

    await cogateway.setRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.beneficiary,
      revertRedeemParams.amount
    );

    // Set co-gateway to owner so that increase supply can be called.
    await utilityToken.setCoGatewayAddress(owner);
    // Send redeem amount to co-gateway.
    await  utilityToken.increaseSupply(cogateway.address, revertRedeemParams.amount, {from: owner});

    // Send penalty and bounty to co-gateway.
    await web3.eth.sendTransaction(
      {
        to: cogateway.address,
        from: accounts[0],
        value: bountyAmount.add(penaltyAmount)
      }
    );
    await utilityToken.setCoGatewayAddress(cogateway.address);

    await cogateway.setOutboxStatus(
      revertRedeemParams.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

  });

  it('should progress revert redeem', async function () {

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    let tx = await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

  });

  it('should emit `RedeemReverted` event ', async function () {

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    let tx = await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    let event = EventDecoder.getEvents(tx, cogateway);
    let eventData = event.RedeemReverted;

    assert.isDefined(
      event.RedeemReverted,
      'Event `RedeemReverted` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      revertRedeemParams.messageHash,
      `Message hash from the event must be equal to ${revertRedeemParams.messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      revertRedeemParams.redeemer,
      `Redeemer address from the event must be equal to ${revertRedeemParams.redeemer}.`,
    );

    assert.strictEqual(
      eventData._redeemerNonce.eq(revertRedeemParams.nonce),
      true,
      `Redeemer nonce from the event must be equal to ${revertRedeemParams.nonce}.`,
    );

    assert.strictEqual(
      eventData._amount.eq(revertRedeemParams.amount),
      true,
      `Redeem amount from the event must be equal to ${revertRedeemParams.amount}.`,
    );

  });

  it('should burn bounty and penalty amount ', async function () {

    let burnerAddress = await cogateway.burner.call();

    let cogatewayInitialTokenBalance = await Utils.getBalance(cogateway.address);
    let redeemerInitialTokenBalance = await Utils.getBalance(revertRedeemParams.redeemer);
    let burnerInitialTokenBalance = await Utils.getBalance(burnerAddress);

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    let cogatewayFinalTokenBalance = await Utils.getBalance(cogateway.address);
    let redeemerFinalTokenBalance = await Utils.getBalance(revertRedeemParams.redeemer);
    let burnerFinalTokenBalance = await Utils.getBalance(burnerAddress);

    assert.strictEqual(
      cogatewayFinalTokenBalance.eq(cogatewayInitialTokenBalance.sub(bountyAmount.muln(2.5))),
      true,
      `CoGateway balance must decrease by ${bountyAmount.muln(2.5).toString(10)}.`,
    );

    assert.strictEqual(
      redeemerInitialTokenBalance.eq(redeemerFinalTokenBalance),
      true,
      `Redeemer balance must not change.`,
    );

    assert.strictEqual(
      burnerFinalTokenBalance.eq(burnerInitialTokenBalance.add(bountyAmount.muln(2.5))),
      true,
      `Burner balance must increase by ${bountyAmount.muln(2.5).toString(10)}.`,
    );

  });

  it('should transfer redeem amount to redeemer ', async function () {

    let burnerAddress = await cogateway.burner.call();

    let cogatewayInitialTokenBalance = await utilityToken.balanceOf(cogateway.address);
    let redeemerInitialTokenBalance = await utilityToken.balanceOf(revertRedeemParams.redeemer);
    let burnerInitialTokenBalance = await utilityToken.balanceOf(burnerAddress);

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    let cogatewayFinalTokenBalance = await utilityToken.balanceOf(cogateway.address);
    let redeemerFinalTokenBalance = await utilityToken.balanceOf(revertRedeemParams.redeemer);
    let burnerFinalTokenBalance = await utilityToken.balanceOf(burnerAddress);

    assert.strictEqual(
      cogatewayFinalTokenBalance.eq(cogatewayInitialTokenBalance.sub(revertRedeemParams.amount)),
      true,
      `Gateway balance must decrease by ${revertRedeemParams.amount.toString(10)}.`,
    );

    assert.strictEqual(
      redeemerFinalTokenBalance.eq(redeemerInitialTokenBalance.add(revertRedeemParams.amount)),
      true,
      `Redeemer balance must increase by ${revertRedeemParams.amount.toString(10)}.`,
    );

    assert.strictEqual(
      burnerFinalTokenBalance.eq(burnerInitialTokenBalance),
      true,
      `Burner balance must not change.`,
    );

  });

  it('should fail when message hash is zero', async function () {

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        ZeroBytes,
        revertRedeemParams.blockHeight,
        revertRedeemParams.rlpParentNodes,
      ),
      'Message hash must not be zero.',
    );

  });

  it('should fail when storage proof zero', async function () {

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight,
        '0x',
      ),
      'RLP parent nodes must not be zero.',
    );
  });

  it('should fail when storage proof is invalid', async function () {

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight,
        "0x1245",
      ),
      'VM Exception while processing transaction: revert',
    );

  });

  it('should fail when storage root is not committed for given block height', async function () {

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight,
        revertRedeemParams.rlpParentNodes,
      ),
      'Storage root must not be zero.',
    );

  });

  it('should fail when message is undeclared', async function () {

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        web3.utils.sha3("dummy"),
        revertRedeemParams.blockHeight,
        revertRedeemParams.rlpParentNodes,
      ),
      'RedeemIntentHash must not be zero.',
    );

  });

  it('should fail when message is progressed', async function () {

    await cogateway.setOutboxStatus(
      revertRedeemParams.messageHash,
      MessageStatusEnum.Progressed,
    );

    await cogateway.setStorageRoot(revertRedeemParams.blockHeight, revertRedeemParams.storageRoot);

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight,
        revertRedeemParams.rlpParentNodes,
      ),
      'Message on source must be DeclaredRevocation.',
    );

  });

  it('should fail when target chain merkle proof verification failed', async function () {

    let blockHeight = new BN(StubData.co_gateway.redeem.proof_data.block_number, 16);
    let storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;

    await cogateway.setStorageRoot(blockHeight, storageRoot);

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        blockHeight,
        StubData.co_gateway.redeem.proof_data.storageProof[0].serializedProof,
      ),
      'Merkle proof verification failed.',
    );

  });

});