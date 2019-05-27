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
const shared = require('../shared');
const Utils = require('../../test/test_lib/utils');
const EventDecoder = require('../../test/test_lib/event_decoder');
const ProofUtils = require('../lib/proof_utils');
const Anchor = require('../lib/anchor');
const RedeemAssertion = require('./utils/redeem_assertion');
const RevertRedeemAssertion = require('./utils/revert_redeem_assertion');
const ProgressRevertRedeemAssertion = require('./utils/progress_revert_redeem_assertion');
const ConfirmRedeemIntentAssertion = require('./utils/confirm_redeem_intent_assertion');
const ConfirmRevertRedeemIntentAssertion = require('./utils/confirm_revert_redeem_intent_assertion');
const ProveGatewayAssertion = require('../lib/prove_gateway_assertion');

describe('Revert Redeem', async () => {
  let originAccounts;
  let auxiliaryAccounts;
  let originWeb3;
  let auxiliaryWeb3;

  let gateway;
  let cogateway;
  let ostPrime;

  let originAnchor;
  let auxiliaryAnchor;
  let redeemRequest;

  let redeemAssertion;
  let proofUtils;
  let messageBoxOffset;
  let assertRevertRedeem;
  let assertProgressRevertRedeem;

  /**
   * Prove cogateway account on gateway contract on origin chain.
   *
   * @return {Promise<ProofCoGatewayResponse>} Promise contains ProofCoGatewayResponse object.
   */
  const proveCoGateway = async () => {
    // Anchor state root.
    const blockNumber = await originAnchor.anchorStateRoot(
      'latest',
    );

    // Generate outbox proof for block height for which state root is
    // anchored.
    const proofData = await proofUtils.getOutboxProof(
      cogateway.address,
      [redeemRequest.messageHash],
      messageBoxOffset,
      auxiliaryWeb3.utils.toHex(blockNumber),
    );
    redeemRequest.blockHeight = new BN(blockNumber);
    // Prove gateway.
    const tx = await gateway.proveGateway(
      redeemRequest.blockHeight,
      proofData.encodedAccountValue,
      proofData.serializedAccountProof,
      { from: originAccounts[0] },
    );

    const event = EventDecoder.getEvents(tx, gateway);
    ProveGatewayAssertion.verify(
      event,
      redeemRequest.blockHeight,
      proofData.storageHash,
      cogateway.address,
    );

    return { proofData, blockNumber: new BN(blockNumber) };
  };

  /**
   * Prove gateway account on cogateway contract on auxiliary chain.
   *
   * @return {Promise<ProofGatewayResponse>} Promise contains ProofGatewayResponse object.
   */
  const proveGateway = async () => {
    // Anchor state root.
    const blockNumber = await auxiliaryAnchor.anchorStateRoot(
      'latest',
    );

    // Generate inbox proof for block height for which state root is
    // anchored.
    const proofData = await proofUtils.getInboxProof(
      gateway.address,
      [redeemRequest.messageHash],
      messageBoxOffset,
      originWeb3.utils.toHex(blockNumber),
    );

    // Prove gateway.
    const tx = await cogateway.proveGateway(
      new BN(blockNumber),
      proofData.encodedAccountValue,
      proofData.serializedAccountProof,
      { from: auxiliaryAccounts[0] },
    );

    const event = EventDecoder.getEvents(tx, cogateway);
    ProveGatewayAssertion.verify(
      event,
      new BN(blockNumber),
      proofData.storageHash,
      gateway.address,
    );

    return { proofData, blockNumber: new BN(blockNumber) };
  };

  before(async () => {
    originWeb3 = shared.origin.web3;
    auxiliaryWeb3 = shared.auxiliary.web3;
    originAccounts = shared.origin.accounts;
    auxiliaryAccounts = shared.auxiliary.accounts;
    gateway = shared.origin.contracts.EIP20Gateway;
    cogateway = shared.auxiliary.contracts.EIP20CoGateway;
    ostPrime = shared.auxiliary.contracts.OSTPrime;

    const hasher = Utils.generateHashLock();

    redeemRequest = {
      amount: new BN(50),
      gasPrice: new BN(1),
      gasLimit: new BN(10),
      redeemer: auxiliaryAccounts[2],
      bounty: await cogateway.bounty.call(),
      nonce: await cogateway.getNonce.call(auxiliaryAccounts[2]),
      beneficiary: originAccounts[2],
      hashLock: hasher.l,
      unlockSecret: hasher.s,
    };

    originAnchor = new Anchor(
      auxiliaryWeb3,
      shared.origin.contracts.Anchor,
      shared.origin.organizationAddress,
    );

    auxiliaryAnchor = new Anchor(
      originWeb3,
      shared.auxiliary.contracts.Anchor,
      shared.auxiliary.organizationAddress,
    );
    redeemAssertion = new RedeemAssertion(cogateway, ostPrime, auxiliaryWeb3);
    proofUtils = new ProofUtils(auxiliaryWeb3, originWeb3);
    messageBoxOffset = await gateway.MESSAGE_BOX_OFFSET.call();
    assertRevertRedeem = new RevertRedeemAssertion(cogateway, ostPrime, auxiliaryWeb3);
    assertProgressRevertRedeem = new ProgressRevertRedeemAssertion(cogateway, ostPrime, auxiliaryWeb3);
  });

  it('redeems', async () => {
    await approveCogatewayForRedeemAmount(
      ostPrime,
      redeemRequest,
      cogateway,
    );

    const initialBalancesBeforeRedeem = await redeemAssertion.captureBalances(
      redeemRequest.redeemer,
    );

    const response = await cogateway.redeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.hashLock,
      {
        from: redeemRequest.redeemer,
        value: redeemRequest.bounty,
      },
    );

    const transactionFeeInRedeem = await getTransactionFee(
      response,
      auxiliaryWeb3,
    );

    const event = EventDecoder.getEvents(response, cogateway);

    await redeemAssertion.verify(
      event,
      redeemRequest,
      transactionFeeInRedeem,
      initialBalancesBeforeRedeem,
    );
    redeemRequest.messageHash = event.RedeemIntentDeclared._messageHash;
  });

  it('confirms redeem', async () => {
    const { proofData, blockNumber } = await proveCoGateway();
    redeemRequest.blockHeight = new BN(blockNumber);

    const tx = await gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      redeemRequest.nonce,
      redeemRequest.beneficiary,
      redeemRequest.amount,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.blockHeight,
      redeemRequest.hashLock,
      proofData.storageProof[0].serializedProof,
      { from: originAccounts[0] },
    );

    const event = EventDecoder.getEvents(tx, gateway);
    // Assert event.
    ConfirmRedeemIntentAssertion.verify(event, redeemRequest);
  });

  it('reverts redeem', async () => {
    // Capture initial token and base token balance of redeemer and cogateway.
    const initialBalances = await assertRevertRedeem.captureBalances(
      redeemRequest.redeemer,
    );

    const penalty = await cogateway.penalty.call(redeemRequest.messageHash);

    const tx = await cogateway.revertRedeem(
      redeemRequest.messageHash,
      {
        from: redeemRequest.redeemer,
        value: penalty,
      },
    );

    const events = EventDecoder.getEvents(tx, cogateway);

    const transactionFeeInRevertRedeem = await getTransactionFee(
      tx,
      auxiliaryWeb3,
    );

    await assertRevertRedeem.verify(
      events,
      redeemRequest,
      transactionFeeInRevertRedeem,
      initialBalances,
    );
  });

  it('confirms redeem intent', async () => {
    const { proofData, blockNumber } = await proveCoGateway();
    redeemRequest.blockHeight = new BN(blockNumber);

    const tx = await gateway.confirmRevertRedeemIntent(
      redeemRequest.messageHash,
      redeemRequest.blockHeight,
      proofData.storageProof[0].serializedProof,
      { from: originAccounts[0] },
    );

    const event = EventDecoder.getEvents(tx, gateway);
    // Assert event.
    ConfirmRevertRedeemIntentAssertion.verify(event, redeemRequest);
  });

  it('progress revert redeem', async () => {
    // Capture initial token and base token balance of redeemer and cogateway.
    const initialBalances = await assertProgressRevertRedeem.captureBalances(
      redeemRequest.redeemer,
    );

    const { proofData, blockNumber } = await proveGateway();
    redeemRequest.blockHeight = new BN(blockNumber);

    const tx = await cogateway.progressRevertRedeem(
      redeemRequest.messageHash,
      redeemRequest.blockHeight,
      proofData.storageProof[0].serializedProof,
      { from: auxiliaryAccounts[0] },
    );

    const events = EventDecoder.getEvents(tx, cogateway);
    await assertProgressRevertRedeem.verify(
      events,
      redeemRequest,
      initialBalances,
    );
  });
});

/**
 * This approves the cogateway for redeem amount by wrapping the base token.
 * @param {Object} ostPrime OSTPrime contract instance.
 * @param {Object} redeemRequest Redeem request object.
 * @param {Object} cogateway CoGateway contract instance.
 * @return {Promise<void>}
 */
async function approveCogatewayForRedeemAmount(ostPrime, redeemRequest, cogateway) {
  await ostPrime.wrap(
    {
      value: redeemRequest.amount,
      from: redeemRequest.redeemer,
    },
  );

  await ostPrime.approve(
    cogateway.address,
    redeemRequest.amount,
    { from: redeemRequest.redeemer },
  );
}

/**
 * This returns transaction fee.
 * @param {Object} response Transaction object by truffle.
 * @param {Web3} web3
 * @return {Promise<BN>} transaction fee.
 */
async function getTransactionFee(response, web3) {
  const transaction = await web3.eth.getTransaction(response.tx);
  const gasUsed = new BN(response.receipt.gasUsed);
  const gasPrice = new BN(transaction.gasPrice);
  return gasUsed.mul(gasPrice);
}
