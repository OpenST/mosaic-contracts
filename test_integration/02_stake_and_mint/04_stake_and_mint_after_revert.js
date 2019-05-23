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

/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('assert');
const BN = require('bn.js');
const shared = require('../shared');
const Utils = require('../../test/test_lib/utils');
const EventDecoder = require('../../test/test_lib/event_decoder');

const ProgressMintAssertion = require('./utils/progress_mint_assertion');
const ProgressStakeAssertion = require('./utils/progress_stake_assertion');
const ProofUtils = require('../lib/proof_utils');
const Anchor = require('../lib/anchor');

describe('Stake and mint (after revert, with proof)', async () => {
  let assertProgressMint;
  let assertProgressStake;
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
  let ostPrime;
  let stakeRequest;
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

    const hasher = Utils.generateHashLock();
    const staker = originAccounts[0];
    stakeRequest = {
      amount: new BN(200),
      gasPrice: new BN(1),
      gasLimit: new BN(100),
      staker,
      bounty: await gateway.bounty(),
      nonce: await gateway.getNonce(staker),
      beneficiary: auxiliaryAccounts[2],
      hashLock: hasher.l,
      unlockSecret: hasher.s,
    };

    assertProgressMint = new ProgressMintAssertion(auxiliaryWeb3, cogateway, ostPrime);
    assertProgressStake = new ProgressStakeAssertion(gateway, token, baseToken);
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
    messageBoxOffset = await gateway.MESSAGE_BOX_OFFSET();
  });

  it('stakes', async () => {
    // Approve gateway for stake amount.
    await token.approve(
      gateway.address,
      stakeRequest.amount,
      { from: stakeRequest.staker },
    );

    // Approve gateway for bounty.
    await baseToken.approve(
      gateway.address,
      stakeRequest.bounty,
      { from: stakeRequest.staker },
    );

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

    stakeRequest.messageHash = event.StakeIntentDeclared._messageHash;
  });

  it('confirms stake', async () => {
    // Anchor state root.
    const blockNumber = await auxiliaryAnchor.anchorStateRoot(
      'latest',
    );

    // Generate outbox proof for block number for which state root is
    // anchored.
    const outboxProof = await proofUtils.getOutboxProof(
      gateway.address,
      [stakeRequest.messageHash],
      messageBoxOffset,
      originWeb3.utils.toHex(blockNumber),
    );

    stakeRequest.blockHeight = new BN(blockNumber);

    // Prove gateway.
    await cogateway.proveGateway(
      stakeRequest.blockHeight,
      outboxProof.encodedAccountValue,
      outboxProof.serializedAccountProof,
      { from: auxiliaryAccounts[0] },
    );

    await cogateway.confirmStakeIntent(
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
  });

  it('reverts stake', async () => {
    const penalty = await gateway.penalty(stakeRequest.messageHash);

    await baseToken.approve(gateway.address, penalty, { from: stakeRequest.staker });

    await gateway.revertStake(
      stakeRequest.messageHash,
      { from: stakeRequest.staker },
    );

    const gatewayOutboxMessageStatus = await gateway.getOutboxMessageStatus(
      stakeRequest.messageHash,
    );
    // MessageBus.MessageStatus.DeclaredRevocation == 3
    const messageStatus = new BN(3);

    assert.strictEqual(
      messageStatus.eq(gatewayOutboxMessageStatus),
      true,
      `Outbox message status must be ${messageStatus}`
        + ` instead of ${gatewayOutboxMessageStatus}`,
    );
  });

  it('progresses mint', async () => {
    // Capture initial OST prime ERC20 and base token balances of
    // beneficiary, OST prime contract and gateway.
    const initialBalances = await assertProgressMint.captureBalances(
      stakeRequest.beneficiary,
    );

    // To progress stake after revert, mint has to have progressed.
    const tx = await cogateway.progressMint(
      stakeRequest.messageHash,
      stakeRequest.unlockSecret,
      { from: auxiliaryAccounts[0] },
    );
    const event = EventDecoder.getEvents(tx, cogateway);

    // Assert event and balances.
    await assertProgressMint.verify(event, stakeRequest, initialBalances, false);
  });

  it('progresses stake', async () => {
    // Anchor state root.
    const blockNumber = await originAnchor.anchorStateRoot(
      'latest',
    );

    // Generate inbox proof for block number for which state root is
    // anchored.
    const inboxProof = await proofUtils.getInboxProof(
      cogateway.address,
      [stakeRequest.messageHash],
      messageBoxOffset,
      auxiliaryWeb3.utils.toHex(blockNumber),
    );

    // Prove cogateway.
    await gateway.proveGateway(
      new BN(blockNumber),
      inboxProof.encodedAccountValue,
      inboxProof.serializedAccountProof,
      { from: originAccounts[0] },
    );

    const coGatewayInboxMessageStatus = await cogateway.getInboxMessageStatus(
      stakeRequest.messageHash,
    );

    // Capture initial token and base token balances of staker and gateway.
    const initialBalances = await assertProgressStake.captureBalances(
      stakeRequest.staker,
    );

    const tx = await gateway.progressStakeWithProof(
      stakeRequest.messageHash,
      inboxProof.storageProof[0].serializedProof,
      blockNumber,
      coGatewayInboxMessageStatus,
      { from: originAccounts[0] },
    );

    const event = EventDecoder.getEvents(tx, gateway);
    // Assert event and balances.
    await assertProgressStake.verify(event, stakeRequest, initialBalances, true);
  });
});
