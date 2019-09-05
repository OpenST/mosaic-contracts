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
const RequestRedeemAssertion = require('./utils/request_redeem_assertion');
const AcceptRedeemAssertion = require('./utils/accept_redeem_assertion');
const ConfirmRedeemIntentAssertion = require('./utils/confirm_redeem_intent_assertion');
const ProgressRedeemAssertion = require('./utils/progress_redeem_assertion');
const ProgressUnstakeAssertion = require('./utils/progress_unstake_assertion');
const ProveGatewayAssertion = require('../lib/prove_gateway_assertion');

describe('Redeem and Unstake with redeem composer', async () => {
  let originAccounts;
  let auxiliaryAccounts;
  let originWeb3;
  let auxiliaryWeb3;

  let gateway;
  let cogateway;
  let redeemPool;
  let token;
  let baseToken;
  let ostPrime;

  let originAnchor;
  let redeemRequest;

  let requestRedeemAssertion;
  let progressRedeemAssertion;
  let progressUnstakeAssertion;
  let proofUtils;
  let messageBoxOffset;

  before(async () => {
    originWeb3 = shared.origin.web3;
    auxiliaryWeb3 = shared.auxiliary.web3;
    originAccounts = shared.origin.accounts;
    auxiliaryAccounts = shared.auxiliary.accounts;
    token = shared.origin.contracts.Token;
    baseToken = shared.origin.contracts.BaseToken;
    gateway = shared.origin.contracts.EIP20Gateway;
    cogateway = shared.auxiliary.contracts.EIP20CoGateway;
    ostPrime = shared.auxiliary.contracts.OSTPrime;
    redeemPool = shared.auxiliary.contracts.RedeemPool;

    const hasher = Utils.generateHashLock();

    redeemRequest = {
      amount: new BN(50),
      gasPrice: new BN(1),
      gasLimit: new BN(10),
      redeemer: auxiliaryAccounts[2],
      redeemInitiator: auxiliaryAccounts[2],
      bounty: await cogateway.bounty.call(),
      beneficiary: originAccounts[2],
      hashLock: hasher.l,
      unlockSecret: hasher.s,
    };

    const proxy = await redeemPool.redeemerProxies.call(redeemRequest.redeemer);
    redeemRequest.nonce = await cogateway.getNonce.call(proxy);
    originAnchor = new Anchor(
      auxiliaryWeb3,
      shared.origin.contracts.Anchor,
      shared.origin.organizationAddress,
    );

    requestRedeemAssertion = new RequestRedeemAssertion(redeemPool, ostPrime, auxiliaryWeb3);
    progressRedeemAssertion = new ProgressRedeemAssertion(
      cogateway,
      ostPrime,
      auxiliaryWeb3,
    );
    progressUnstakeAssertion = new ProgressUnstakeAssertion(
      gateway,
      token,
      baseToken,
    );
    proofUtils = new ProofUtils(auxiliaryWeb3, originWeb3);
    messageBoxOffset = await gateway.MESSAGE_BOX_OFFSET.call();
  });

  it('request redeem', async () => {
    await approveRedeemPoolForRedeemAmount(
      ostPrime,
      redeemRequest,
      redeemPool,
    );

    const initialBalancesBeforeRedeem = await requestRedeemAssertion.captureBalances(
      redeemRequest.redeemer,
    );

    const response = await redeemPool.requestRedeem(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      cogateway.address,
      {
        from: redeemRequest.redeemer,
      },
    );


    const transactionFeeInProgress = await getTransactionFee(
      response,
      auxiliaryWeb3,
    );
    const requestEvent = EventDecoder.getEvents(response, redeemPool);

    await requestRedeemAssertion.verify(
      requestEvent,
      redeemRequest,
      transactionFeeInProgress,
      initialBalancesBeforeRedeem,
    );
  });


  it('aceept redeem', async () => {
    redeemRequest.facilitator = shared.auxiliary.deployerAddress;
    const acceptResponse = await redeemPool.acceptRedeemRequest(
      redeemRequest.amount,
      redeemRequest.beneficiary,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.nonce,
      redeemRequest.redeemer,
      cogateway.address,
      redeemRequest.hashLock,
      {
        from: redeemRequest.facilitator,
        value: redeemRequest.bounty,
      },
    );

    redeemRequest.redeemer = originWeb3.utils.toChecksumAddress(
      await redeemPool.redeemerProxies.call(redeemRequest.redeemer),
    );
    const event = EventDecoder.getEvents(acceptResponse, cogateway);

    AcceptRedeemAssertion._assertRedeemEvent(event, redeemRequest);
    redeemRequest.messageHash = event.RedeemIntentDeclared._messageHash;
  });

  it('confirms redeem', async () => {
    // Anchor state root.
    const blockNumber = await originAnchor.anchorStateRoot(
      'latest',
    );

    // Generate outbox proof for block height for which state root is
    // anchored.
    const outboxProof = await proofUtils.getOutboxProof(
      cogateway.address,
      [redeemRequest.messageHash],
      messageBoxOffset,
      auxiliaryWeb3.utils.toHex(blockNumber),
    );

    redeemRequest.blockHeight = new BN(blockNumber);
    // Prove gateway.
    let tx = await gateway.proveGateway(
      redeemRequest.blockHeight,
      outboxProof.encodedAccountValue,
      outboxProof.serializedAccountProof,
      { from: originAccounts[0] },
    );

    let event = EventDecoder.getEvents(tx, gateway);

    ProveGatewayAssertion.verify(
      event,
      redeemRequest.blockHeight,
      outboxProof.storageHash,
      cogateway.address,
    );

    tx = await gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      redeemRequest.nonce,
      redeemRequest.beneficiary,
      redeemRequest.amount,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.blockHeight,
      redeemRequest.hashLock,
      outboxProof.storageProof[0].serializedProof,
      { from: originAccounts[0] },
    );

    event = EventDecoder.getEvents(tx, gateway);
    // Assert event.
    ConfirmRedeemIntentAssertion.verify(event, redeemRequest);
  });

  it('progresses redeem', async () => {
    const initialBalanceBeforeProgress = await progressRedeemAssertion.captureBalances(
      redeemRequest.redeemInitiator,
    );

    const response = await cogateway.progressRedeem(
      redeemRequest.messageHash,
      redeemRequest.unlockSecret,
      {from: auxiliaryAccounts[2]},
    );

    const transactionFeeInProgress = await getTransactionFee(
      response,
      auxiliaryWeb3,
    );
    const event = EventDecoder.getEvents(response, cogateway);

    await progressRedeemAssertion.verify(
      event,
      redeemRequest,
      transactionFeeInProgress,
      initialBalanceBeforeProgress,
      false,
      redeemRequest.redeemInitiator,
    );
  });

  it('progresses unstake', async () => {
    const facilitator = originAccounts[0];
    const initialBalancesBeforeProgress = await progressUnstakeAssertion.captureBalances(
      redeemRequest.beneficiary,
      facilitator,
    );

    const tx = await gateway.progressUnstake(
      redeemRequest.messageHash,
      redeemRequest.unlockSecret,
      { from: facilitator },
    );

    const event = EventDecoder.getEvents(tx, gateway);

    await progressUnstakeAssertion.verify(
      event,
      redeemRequest,
      initialBalancesBeforeProgress,
      facilitator,
      false,
    );
  });
});

/**
 * This approves the cogateway for redeem amount by wrapping the base token.
 * @param {Object} ostPrime OSTPrime contract instance.
 * @param {Object} redeemRequest Redeem request object.
 * @param {Object} redeemPool redeemPool contract instance.
 * @return {Promise<void>}
*/
async function approveRedeemPoolForRedeemAmount(ostPrime, redeemRequest, redeemPool) {
  await ostPrime.wrap(
    {
      value: redeemRequest.amount,
      from: redeemRequest.redeemer,
    },
  );

  await ostPrime.approve(
    redeemPool.address,
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
