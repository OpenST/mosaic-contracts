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

'use strict';

const BN = require('bn.js');
const shared = require('../shared');
const Utils = require('../../test/test_lib/utils');
const EventDecoder = require('../../test/test_lib/event_decoder');

const StakeAssertion = require('./utils/stake_assertion');
const RevertStakeAssertion = require('./utils/revert_stake_assertion');
const ProgressRevertStakeAssertion = require('./utils/progress_revert_stake_assertion');
const ProveGatewayAssertion = require('../lib/prove_gateway_assertion');
const ConfirmStakeIntentAssertion = require('./utils/confirm_stake_intent_assertion');
const ConfirmRevertStakeIntentAssertion = require('./utils/confirm_revert_stake_intent_assertion');
const ProofUtils = require('../lib/proof_utils');
const Anchor = require('../lib/anchor');

/**
 * Approve Gateway for stake amount.
 * @param {Object} token Token contract instance.
 * @param {Object} gateway Gateway contract instance.
 * @param {Object} stakeRequest stake request.
 * @return {Promise<void>}
 */
async function approveGatewayForStakeAmount(token, gateway, stakeRequest) {
  await token.approve(
    gateway.address,
    stakeRequest.amount,
    { from: stakeRequest.staker },
  );
}

/**
 * Approve gateway for bounty.
 * @param {Object} baseToken Base token contract instance.
 * @param {Object} gateway Gateway contract instance.
 * @param {Object} stakeRequest stake request.
 * @return {Promise<void>}
 */
async function approveGatewayForBounty(baseToken, gateway, stakeRequest) {
  await baseToken.approve(
    gateway.address,
    stakeRequest.bounty,
    { from: stakeRequest.staker },
  );
}

describe('Revert Stake and mint', async () => {
  let assertStake;
  let assertRevertStake;
  let assertProgressRevertStake;
  let proofUtils;

  let originAccounts;
  let auxiliaryAccounts;
  let originWeb3;
  let auxiliaryWeb3;

  let gateway;
  let cogateway;
  let token;
  let baseToken;
  let auxiliaryAnchor;
  let originAnchor;
  let stakeRequest;
  let messageBoxOffset;

  before(async () => {
    originWeb3 = shared.origin.web3;
    auxiliaryWeb3 = shared.auxiliary.web3;
    originAccounts = shared.origin.accounts;
    auxiliaryAccounts = shared.origin.accounts;
    token = shared.origin.contracts.Token;
    baseToken = shared.origin.contracts.BaseToken;
    gateway = shared.origin.contracts.EIP20Gateway;
    cogateway = shared.auxiliary.contracts.EIP20CoGateway;

    const hasher = Utils.generateHashLock();
    const staker = originAccounts[0];
    stakeRequest = {
      amount: new BN(200),
      gasPrice: new BN(1),
      gasLimit: new BN(100),
      staker,
      bounty: await gateway.bounty.call(),
      nonce: await gateway.getNonce.call(staker),
      beneficiary: auxiliaryAccounts[2],
      hashLock: hasher.l,
      unlockSecret: hasher.s,
    };

    assertStake = new StakeAssertion(gateway, token, baseToken);
    assertRevertStake = new RevertStakeAssertion(gateway, token, baseToken);
    assertProgressRevertStake = new ProgressRevertStakeAssertion(gateway, token, baseToken);
    proofUtils = new ProofUtils(originWeb3, auxiliaryWeb3);
    auxiliaryAnchor = new Anchor(
      originWeb3,
      shared.auxiliary.contracts.Anchor,
      shared.auxiliary.organizationAddress,
    );
    originAnchor = new Anchor(
      auxiliaryWeb3,
      shared.origin.contracts.Anchor,
      shared.origin.organizationAddress,
    );
    messageBoxOffset = await gateway.MESSAGE_BOX_OFFSET.call();
  });


  it('stakes', async () => {
    // Capture initial token and base token balance of staker and gateway.
    const initialBalances = await assertStake.captureBalances(stakeRequest.staker);

    await approveGatewayForStakeAmount(token, gateway, stakeRequest);
    await approveGatewayForBounty(baseToken, gateway, stakeRequest);

    const tx = await gateway.stake(
      stakeRequest.amount,
      stakeRequest.beneficiary,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.nonce,
      stakeRequest.hashLock,
      { from: stakeRequest.staker },
    );

    const event = EventDecoder.getEvents(tx, gateway);
    // Assert event and balances.
    await assertStake.verify(event, stakeRequest, initialBalances);

    stakeRequest.messageHash = event.StakeIntentDeclared._messageHash;
  });

  it('confirms stake', async () => {
    // Anchor state root.
    const blockNumber = await auxiliaryAnchor.anchorStateRoot(
      'latest',
    );
    // Generate outbox proof for block height for which state root is
    // anchored.
    const outboxProof = await proofUtils.getOutboxProof(
      gateway.address,
      [stakeRequest.messageHash],
      messageBoxOffset,
      originWeb3.utils.toHex(blockNumber),
    );

    stakeRequest.blockHeight = new BN(blockNumber);
    // Prove gateway.
    let tx = await cogateway.proveGateway(
      stakeRequest.blockHeight,
      outboxProof.encodedAccountValue,
      outboxProof.serializedAccountProof,
      { from: auxiliaryAccounts[0] },
    );

    let event = EventDecoder.getEvents(tx, cogateway);
    ProveGatewayAssertion.verify(
      event,
      stakeRequest.blockHeight,
      outboxProof.storageHash,
      gateway.address,
    );

    tx = await cogateway.confirmStakeIntent(
      stakeRequest.staker,
      stakeRequest.nonce,
      stakeRequest.beneficiary,
      stakeRequest.amount,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.hashLock,
      stakeRequest.blockHeight,
      outboxProof.storageProof[0].serializedProof,
      { from: auxiliaryAccounts[0] },
    );

    event = EventDecoder.getEvents(tx, cogateway);
    // Assert event.
    ConfirmStakeIntentAssertion.verify(event, stakeRequest);
  });

  it('revert stake', async () => {
    // Capture initial token and base token balance of staker and gateway.
    const initialBalances = await assertRevertStake.captureBalances(
      stakeRequest.staker,
    );

    const {
      messageHash,
      staker,
    } = stakeRequest;

    const bounty = await gateway.bounty.call();
    const penaltyFactor = await gateway.REVOCATION_PENALTY.call();
    const penalty = bounty.mul(penaltyFactor).divn(100);

    await baseToken.approve(gateway.address, penalty, { from: staker });

    const tx = await gateway.revertStake(
      messageHash,
      { from: staker },
    );

    const events = EventDecoder.getEvents(tx, gateway);

    await assertRevertStake.verify(
      events,
      stakeRequest,
      initialBalances,
    );
  });

  it('confirms revert stake', async () => {
    // Anchor state root.
    const blockNumber = await auxiliaryAnchor.anchorStateRoot(
      'latest',
    );
    // Generate outbox proof for block height for which state root is
    // anchored.
    const outboxProof = await proofUtils.getOutboxProof(
      gateway.address,
      [stakeRequest.messageHash],
      messageBoxOffset,
      originWeb3.utils.toHex(blockNumber),
    );

    stakeRequest.blockHeight = new BN(blockNumber);
    // Prove gateway.
    let tx = await cogateway.proveGateway(
      stakeRequest.blockHeight,
      outboxProof.encodedAccountValue,
      outboxProof.serializedAccountProof,
      { from: auxiliaryAccounts[0] },
    );

    const event = EventDecoder.getEvents(tx, cogateway);
    ProveGatewayAssertion.verify(
      event,
      stakeRequest.blockHeight,
      outboxProof.storageHash,
      gateway.address,
    );

    const {
      messageHash,
      blockHeight,
    } = stakeRequest;

    const rlpParentNodes = outboxProof.storageProof[0].serializedProof;
    const facilitator = auxiliaryAccounts[0];

    tx = await cogateway.confirmRevertStakeIntent(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: facilitator },
    );

    const events = EventDecoder.getEvents(tx, cogateway);

    ConfirmRevertStakeIntentAssertion.verify(events, stakeRequest);
  });

  it('progress revert stake', async () => {
    // Capture initial token and base token balance of staker and gateway.
    const initialBalances = await assertProgressRevertStake.captureBalances(
      stakeRequest.staker,
    );
    const blockNumber = await originAnchor.anchorStateRoot(
      'latest',
    );
    // Generate inbox proof for block height for which state root is
    // anchored.
    const inboxProof = await proofUtils.getInboxProof(
      cogateway.address,
      [stakeRequest.messageHash],
      messageBoxOffset,
      originWeb3.utils.toHex(blockNumber),
    );

    stakeRequest.blockHeight = new BN(blockNumber);
    // Prove gateway.
    let tx = await gateway.proveGateway(
      stakeRequest.blockHeight,
      inboxProof.encodedAccountValue,
      inboxProof.serializedAccountProof,
      { from: originAccounts[0] },
    );

    const event = EventDecoder.getEvents(tx, gateway);
    ProveGatewayAssertion.verify(
      event,
      stakeRequest.blockHeight,
      inboxProof.storageHash,
      cogateway.address,
    );

    const {
      messageHash,
      blockHeight,
    } = stakeRequest;

    const rlpParentNodes = inboxProof.storageProof[0].serializedProof;

    tx = await gateway.progressRevertStake(
      messageHash,
      blockHeight,
      rlpParentNodes,
      { from: originAccounts[0] },
    );

    const events = EventDecoder.getEvents(tx, gateway);
    await assertProgressRevertStake.verify(
      events,
      stakeRequest,
      initialBalances,
    );
  });
});
