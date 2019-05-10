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
const ProveGatewayAssertion = require('../lib/prove_gateway_assertion');
const ConfirmStakeIntentAssertion = require('./utils/confirm_stake_intent_assertion');
const ProgressStakeAssertion = require('./utils/progress_stake_assertion');
const ProgressMintAssertion = require('./utils/progress_mint_assertion');
const ProofUtils = require('../lib/proof_utils');
const Anchor = require('../lib/anchor');


let assertStake;
let assertProgressStake;
let assertProgressMint;
let proofUtils;

let originAccounts;
let auxiliaryAccounts;
let originWeb3;
let auxiliaryWeb3;

let gateway;
let cogateway;
let token;
let baseToken;
let originAnchor;
let auxiliaryAnchor;
let ostPrime;
let stakeRequest;

const MessageStatus = {
  Undeclared: 0,
  Declared: 1,
  Progressed: 2,
  DeclaredRevocation: 3,
  Revoked: 4,
};

describe('Stake and mint (with proof)', async () => {
  before_each(async () => {
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
    stakeRequest = {
      amount: new BN(200),
      gasPrice: new BN(1),
      gasLimit: new BN(100),
      staker: originAccounts[0],
      bounty: await gateway.bounty.call(),
      nonce: await gateway.getNonce.call(originAccounts[0]),
      beneficiary: auxiliaryAccounts[2],
      hashLock: hasher.l,
      unlockSecret: hasher.s,
    };

    assertStake = new StakeAssertion(gateway, token, baseToken);
    assertProgressStake = new ProgressStakeAssertion(gateway, token, baseToken);
    assertProgressMint = new ProgressMintAssertion(auxiliaryWeb3, cogateway, ostPrime);
    proofUtils = new ProofUtils(originWeb3, auxiliaryWeb3);
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
  });

  it('Stake & Mint (progress stake and then progress mint)', async () => {
    await stake();
    await confirmStakeIntent();
    await progressStakeWithProof(MessageStatus.Declared);
    await progressMintWithProof(MessageStatus.Progressed);
  });

  it('Stake & Mint (progress mint and then progress stake)', async () => {
    await stake();
    await confirmStakeIntent();
    await progressMintWithProof(MessageStatus.Declared);
    await progressStakeWithProof(MessageStatus.Progressed);
  });

});

/**
 * Prove gateway account on cogateway contract.
 * @return {Promise<object>}
 */
const proveGateway = async () => {
  // Anchor state root.
  const blockNumber = await auxiliaryAnchor.anchorStateRoot(
    'latest',
  );

  // Generate outbox proof for block height for which state root is
  // anchored.
  const outboxProof = await proofUtils.getOutboxProof(
    gateway.address,
    [stakeRequest.messageHash],
    originWeb3.utils.toHex(blockNumber),
  );

  // Prove gateway.
  let tx = await cogateway.proveGateway(
    new BN(blockNumber),
    outboxProof.encodedAccountValue,
    outboxProof.serializedAccountProof,
    { from: auxiliaryAccounts[0] },
  );

  let event = EventDecoder.getEvents(tx, cogateway);
  ProveGatewayAssertion.verify(
    event,
    new BN(blockNumber),
    outboxProof.storageHash,
    gateway.address,
  );

  return {outboxProof, blockNumber: new BN(blockNumber)};
};

/**
 * Prove cogateway account on gateway contract.
 * @return {Promise<object>}
 */
const proveCoGateway = async () => {
  // Anchor state root.
  const blockNumber = await originAnchor.anchorStateRoot(
    'latest',
  );
  // Generate outbox proof for block height for which state root is
  // anchored.
  const inboxProof = await proofUtils.getInboxProof(
    cogateway.address,
    [stakeRequest.messageHash],
    auxiliaryWeb3.utils.toHex(blockNumber),
  );

  // Prove gateway.
  let proofTx = await gateway.proveGateway(
    new BN(blockNumber),
    inboxProof.encodedAccountValue,
    inboxProof.serializedAccountProof,
    { from: originAccounts[0] },
  );

  let proofEvent = EventDecoder.getEvents(proofTx, gateway);
  ProveGatewayAssertion.verify(
    proofEvent,
    new BN(blockNumber),
    inboxProof.storageHash,
    cogateway.address,
  );

  return {inboxProof,  blockNumber: new BN(blockNumber)};
};

/**
 * Stake.
 * @return {Promise<void>}
 */
const stake = async () => {
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
};

/**
 * Confirm stake intent.
 * @return {Promise<void>}
 */
const confirmStakeIntent = async () => {
  const {outboxProof, blockNumber} = await proveGateway();

  stakeRequest.blockHeight = new BN(blockNumber);
  let tx = await cogateway.confirmStakeIntent(
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

  let event = EventDecoder.getEvents(tx, cogateway);
  // Assert event.
  ConfirmStakeIntentAssertion.verify(event, stakeRequest);
};

/**
 * Progress stake with proof.
 * @param {number} coGatewayInboxMessageStatus Inbox message status in cogateway.
 * @return {Promise<void>}
 */
const progressStakeWithProof = async (coGatewayInboxMessageStatus) => {
  const {inboxProof, blockNumber} = await proveCoGateway();

  // Capture initial token and base token balance of staker and gateway.
  const initialBalancesBeforeProgress = await assertProgressStake.captureBalances(
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
  await assertProgressStake.verify(event, stakeRequest, initialBalancesBeforeProgress, true);
};

/**
 * Progress mint with proof.
 * @param {number} gatewayInboxMessageStatus Outbox message status in gateway.
 * @return {Promise<void>}
 */
const progressMintWithProof = async (gatewayOutboxMessageStatus) => {
  const {outboxProof, blockNumber} = await proveGateway();

  // Capture initial OST prime ERC20 and base token balance of
  // beneficiary, OST prime contract address and gateway.
  const initialBalancesBeforeMint = await assertProgressMint.captureBalances(
    stakeRequest.beneficiary,
  );

  const tx = await cogateway.progressMintWithProof(
    stakeRequest.messageHash,
    outboxProof.storageProof[0].serializedProof,
    blockNumber,
    gatewayOutboxMessageStatus,
    { from: auxiliaryAccounts[0] },
  );
  const event = EventDecoder.getEvents(tx, cogateway);

  // Assert event and balances.
  await assertProgressMint.verify(event, stakeRequest, initialBalancesBeforeMint, true);
};


/**
 * Approve Gateway for stake amount.
 * @param {Object }token Token contract instance.
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
