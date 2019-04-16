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
const ConfirmRedeemIntentAssertion = require('./utils/confirm_redeem_intent_assertion');
const ProgressRedeemAssertion = require('./utils/progress_redeem_assertion');
const ProgressUnstakeAssertion = require('./utils/progress_unstake_assertion');
const ProveGatewayAssertion = require('../lib/prove_gateway_assertion');

describe('Redeem and Unstake', async () => {
  let originAccounts;
  let auxiliaryAccounts;
  let originWeb3;
  let auxiliaryWeb3;

  let gateway;
  let cogateway;
  let token;
  let baseToken;
  let ostPrime;

  let originAnchor;
  let redeemRequest;

  let redeemAssertion;
  let progressRedeemAssertion;
  let progressUnstakeAssertion;
  let proofUtils;

  before(async () => {
    originWeb3 = shared.origin.web3;
    auxiliaryWeb3 = shared.auxiliary.web3;
    originAccounts = shared.origin.accounts;
    auxiliaryAccounts = shared.origin.accounts;
    token = shared.origin.contracts.Token;
    baseToken = shared.origin.contracts.BaseToken;
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

    redeemAssertion = new RedeemAssertion(cogateway, ostPrime, auxiliaryWeb3);
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
    // Anchor state root.
    const blockNumber = await originAnchor.anchorStateRoot(
      'latest',
    );

    // Generate outbox proof for block height for which state root is
    // anchored.
    const outboxProof = await proofUtils.getOutboxProof(
      cogateway.address,
      [redeemRequest.messageHash],
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
      redeemRequest.redeemer,
    );

    const response = await cogateway.progressRedeem(
      redeemRequest.messageHash,
      redeemRequest.unlockSecret,
      { from: redeemRequest.redeemer },
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
