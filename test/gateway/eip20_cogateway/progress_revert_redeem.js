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
const CoGatewayUtils = require('./helpers/co_gateway_utils.js');
const StubData = require('../../../test/data/redeem_revoked_1.json');

const ZeroBytes = Utils.ZERO_BYTES32;
const { MessageStatusEnum } = messageBus;
const PENALTY_MULTIPLIER = 1.5;

contract('EIP20CoGateway.progressRevertRedeem()', (accounts) => {
  let utilityToken;
  let cogateway;
  let revertRedeemParams;
  let bountyAmount;
  let penaltyAmount;
  let owner;
  let facilitator;

  beforeEach(async () => {
    owner = accounts[0];
    facilitator = accounts[1];

    const redeemRequest = StubData.co_gateway.redeem.params;
    const confirmRedeemRequest = StubData.gateway.confirm_revert_redeem_intent;

    revertRedeemParams = {
      redeemer: redeemRequest.redeemer,
      amount: new BN(redeemRequest.amount, 16),
      beneficiary: redeemRequest.beneficiary,
      gasPrice: new BN(redeemRequest.gasPrice, 16),
      gasLimit: new BN(redeemRequest.gasLimit, 16),
      nonce: new BN(redeemRequest.nonce, 16),
      hashLock: redeemRequest.hashLock,
      rlpParentNodes:
        confirmRedeemRequest.proof_data.storageProof[0].serializedProof,
      blockHeight: new BN(confirmRedeemRequest.proof_data.block_number, 16),
      storageRoot: confirmRedeemRequest.proof_data.storageHash,
      messageStatus: MessageStatusEnum.Declared,
    };

    const decimal = 18;
    const token = accounts[9];
    const symbol = 'DUM';
    const name = 'Dummy';
    const organization = accounts[2];
    utilityToken = await MockUtilityToken.new(
      token,
      symbol,
      name,
      decimal,
      organization,
      { from: owner },
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
      accounts[8], // burner
    );

    await setupContractPreCondition(
      revertRedeemParams,
      cogateway,
      accounts,
      bountyAmount,
      penaltyAmount,
      utilityToken,
      owner,
    );

    await cogateway.setStorageRoot(
      revertRedeemParams.blockHeight,
      revertRedeemParams.storageRoot,
    );
  });

  it('should progress revert redeem', async () => {
    await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );
  });

  it('should return correct response', async () => {
    const response = await cogateway.progressRevertRedeem.call(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    assert.strictEqual(
      response.redeemer_,
      revertRedeemParams.redeemer,
      `Expected redeemer ${
        revertRedeemParams.redeemer
      } is different from redeemer from 
      event ${response.redeemer_}`,
    );
    assert.strictEqual(
      response.redeemerNonce_.eq(revertRedeemParams.nonce),
      true,
      `Expected stakerNonce ${revertRedeemParams.nonce.toString(
        10,
      )} is different from nonce from 
      event ${response.redeemerNonce_.toString(10)}`,
    );
    assert.strictEqual(
      response.amount_.eq(revertRedeemParams.amount),
      true,
      `Expected amount ${revertRedeemParams.amount.toString(
        10,
      )} is different from amount from 
      event ${response.amount_.toString(10)}`,
    );
  });

  it('should emit `RedeemReverted` event', async () => {
    const tx = await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    const event = EventDecoder.getEvents(tx, cogateway);
    const eventData = event.RedeemReverted;

    assert.isDefined(
      event.RedeemReverted,
      'Event `RedeemReverted` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      revertRedeemParams.messageHash,
      `Message hash from the event must be equal to ${
        revertRedeemParams.messageHash
      }.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      revertRedeemParams.redeemer,
      `Redeemer address from the event must be equal to ${
        revertRedeemParams.redeemer
      }.`,
    );

    assert.strictEqual(
      eventData._redeemerNonce.eq(revertRedeemParams.nonce),
      true,
      `Redeemer nonce from the event ${eventData._redeemerNonce.toString(10)}
       must be equal to ${revertRedeemParams.nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._amount.eq(revertRedeemParams.amount),
      true,
      `Redeem amount from the event ${eventData._amount.toString(10)} 
      must be equal to ${revertRedeemParams.amount.toString(10)}.`,
    );
  });

  it('should burn bounty and penalty amount', async () => {
    const burnerAddress = await cogateway.burner.call();

    const cogatewayInitialTokenBalance = await Utils.getBalance(
      cogateway.address,
    );
    const redeemerInitialTokenBalance = await Utils.getBalance(
      revertRedeemParams.redeemer,
    );
    const burnerInitialTokenBalance = await Utils.getBalance(burnerAddress);

    await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    const cogatewayFinalTokenBalance = await Utils.getBalance(
      cogateway.address,
    );
    const redeemerFinalTokenBalance = await Utils.getBalance(
      revertRedeemParams.redeemer,
    );
    const burnerFinalTokenBalance = await Utils.getBalance(burnerAddress);

    // Penalty is paid by redeemer and it is burned with bounty on
    // message revocation.
    const penalty = bountyAmount.muln(PENALTY_MULTIPLIER);

    const expectedCoGatewayBalance = cogatewayInitialTokenBalance.sub(
      bountyAmount.add(penalty),
    );
    assert.strictEqual(
      cogatewayFinalTokenBalance.eq(expectedCoGatewayBalance),
      true,
      `CoGateway final balance ${cogatewayFinalTokenBalance.toString(10)} 
      must be equal to ${expectedCoGatewayBalance.toString(10)}.`,
    );

    assert.strictEqual(
      redeemerFinalTokenBalance.eq(redeemerInitialTokenBalance),
      true,
      `Redeemer final balance ${redeemerFinalTokenBalance.toString(10)} must 
      be equal to ${redeemerInitialTokenBalance.toString(10)}.`,
    );

    const expectedBurnerBalance = burnerInitialTokenBalance.add(
      bountyAmount.add(penalty),
    );
    assert.strictEqual(
      burnerFinalTokenBalance.eq(expectedBurnerBalance),
      true,
      `Burner final balance ${burnerFinalTokenBalance.toString(10)} 
      must be equal to ${expectedBurnerBalance.toString(10)}.`,
    );
  });

  it('should transfer ERC20 redeem amount to redeemer', async () => {
    const burnerAddress = await cogateway.burner.call();

    const cogatewayInitialTokenBalance = await utilityToken.balanceOf(
      cogateway.address,
    );
    const redeemerInitialTokenBalance = await utilityToken.balanceOf(
      revertRedeemParams.redeemer,
    );
    const burnerInitialTokenBalance = await utilityToken.balanceOf(
      burnerAddress,
    );

    await cogateway.progressRevertRedeem(
      revertRedeemParams.messageHash,
      revertRedeemParams.blockHeight,
      revertRedeemParams.rlpParentNodes,
    );

    const cogatewayFinalTokenBalance = await utilityToken.balanceOf(
      cogateway.address,
    );
    const redeemerFinalTokenBalance = await utilityToken.balanceOf(
      revertRedeemParams.redeemer,
    );
    const burnerFinalTokenBalance = await utilityToken.balanceOf(
      burnerAddress,
    );

    const coGatewayExpectedBalance = cogatewayInitialTokenBalance.sub(
      revertRedeemParams.amount,
    );
    assert.strictEqual(
      cogatewayFinalTokenBalance.eq(coGatewayExpectedBalance),
      true,
      `Gateway final balance ${cogatewayFinalTokenBalance.toString(10)} 
      must be equal to ${coGatewayExpectedBalance.toString(10)}.`,
    );

    const expectedRedeemerBalance = redeemerInitialTokenBalance.add(
      revertRedeemParams.amount,
    );
    assert.strictEqual(
      redeemerFinalTokenBalance.eq(expectedRedeemerBalance),
      true,
      `Redeemer final balance ${redeemerFinalTokenBalance.toString(10)} 
      must be equal to ${expectedRedeemerBalance.toString(10)}.`,
    );

    assert.strictEqual(
      burnerFinalTokenBalance.eq(burnerInitialTokenBalance),
      true,
      `Burner final balance ${burnerFinalTokenBalance.toString(10)} 
       must be equal to ${burnerInitialTokenBalance.toString(10)}.`,
    );
  });

  it('should fail when message hash is zero', async () => {
    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        ZeroBytes,
        revertRedeemParams.blockHeight,
        revertRedeemParams.rlpParentNodes,
      ),
      'Message hash must not be zero.',
    );
  });

  it('should fail when storage proof zero', async () => {
    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight,
        '0x',
      ),
      'RLP parent nodes must not be zero.',
    );
  });

  it('should fail when storage proof is invalid', async () => {
    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight,
        '0x1245',
      ),
      'VM Exception while processing transaction: revert',
    );
  });

  it('should fail when storage root is not committed for given block height', async () => {
    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight.addn(1),
        revertRedeemParams.rlpParentNodes,
      ),
      'Storage root must not be zero.',
    );
  });

  it('should fail when message is undeclared', async () => {
    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        web3.utils.sha3('dummy'),
        revertRedeemParams.blockHeight,
        revertRedeemParams.rlpParentNodes,
      ),
      'RedeemIntentHash must not be zero.',
    );
  });

  it('should fail when message is progressed', async () => {
    await cogateway.setOutboxStatus(
      revertRedeemParams.messageHash,
      MessageStatusEnum.Progressed,
    );

    await Utils.expectRevert(
      cogateway.progressRevertRedeem(
        revertRedeemParams.messageHash,
        revertRedeemParams.blockHeight,
        revertRedeemParams.rlpParentNodes,
      ),
      'Message status on source must be DeclaredRevocation.',
    );
  });

  it('should fail when target chain merkle proof verification failed', async () => {
    const blockHeight = new BN(
      StubData.co_gateway.redeem.proof_data.block_number,
      16,
    );
    const storageRoot = StubData.co_gateway.redeem.proof_data.storageHash;

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

async function setupContractPreCondition(
  revertRedeemParams,
  cogateway,
  accounts,
  bountyAmount,
  penaltyAmount,
  utilityToken,
  owner,
) {
  const redeemIntentHash = CoGatewayUtils.hashRedeemIntent(
    revertRedeemParams.amount,
    revertRedeemParams.beneficiary,
    StubData.contracts.coGateway,
  );

  const messageHash = messageBus.messageDigest(
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
    revertRedeemParams.amount,
  );

  // Send penalty and bounty to co-gateway.
  await web3.eth.sendTransaction({
    to: cogateway.address,
    from: accounts[0],
    value: bountyAmount.add(penaltyAmount),
  });

  // Set co-gateway to owner so that increase supply can be called.
  await utilityToken.setCoGatewayAddress(owner);
  // Send redeem amount to co-gateway.
  await utilityToken.increaseSupply(
    cogateway.address,
    revertRedeemParams.amount,
    { from: owner },
  );

  await utilityToken.setCoGatewayAddress(cogateway.address);

  await cogateway.setOutboxStatus(
    revertRedeemParams.messageHash,
    MessageStatusEnum.DeclaredRevocation,
  );
}
