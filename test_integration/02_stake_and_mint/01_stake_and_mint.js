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

const BN = require('bn.js');
const shared = require('../shared');
const Utils = require('../../test/test_lib/utils');
const EventDecoder = require('../../test/test_lib/event_decoder');

const AssertStake = require('./utils/assert_stake');
const AssertProveGateway = require('./utils/assert_prove_gateway');
const AssertAnchorStateRoot = require('./utils/assert_anchor_stateroot');
const AssertConfirmStakeIntent = require('./utils/assert_confirm_stake_intent');
const AssertProgressStake = require('./utils/assert_progress_stake');
const AssertProgressMint = require('./utils/assert_progress_mint');
const ProofUtils = require('./utils/proof_utils');

describe('Stake and mint', async () => {
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
    let auxiliaryAnchor;
    let ostPrime;

    let messageHash;
    let initialBalances;
    const hasher = Utils.generateHashLock();

    const stakeRequest = {
        amount: new BN(200),
        gasPrice: new BN(1),
        gasLimit: new BN(100),
        hashLock: hasher.l,
        unlockSecret: hasher.s,
    };

    before(async () => {
        originWeb3 = shared.origin.web3;
        auxiliaryWeb3 = shared.auxiliary.web3;
        originAccounts = shared.origin.accounts;
        auxiliaryAccounts = shared.origin.accounts;
        token = shared.origin.contracts.BrandedToken;
        baseToken = shared.origin.contracts.BaseToken;
        gateway = shared.origin.contracts.EIP20Gateway;
        cogateway = shared.auxiliary.contracts.EIP20CoGateway;
        auxiliaryAnchor = shared.auxiliary.contracts.Anchor;
        ostPrime = shared.auxiliary.contracts.OSTPrime;

        [stakeRequest.staker] = originAccounts;
        stakeRequest.bounty = await gateway.bounty.call();
        stakeRequest.nonce = await gateway.getNonce.call(stakeRequest.staker);
        stakeRequest.beneficiary = auxiliaryAccounts[2];

        assertStake = new AssertStake(gateway, token, baseToken);
        assertProgressStake = new AssertProgressStake(gateway, token, baseToken);
        assertProgressMint = new AssertProgressMint(auxiliaryWeb3, cogateway, ostPrime);
        initialBalances = await assertStake.captureBalances(stakeRequest.staker);
        proofUtils = new ProofUtils(originWeb3, auxiliaryWeb3);
    });

    it('stake', async () => {
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
        await assertStake.verify(event, stakeRequest, initialBalances);

        messageHash = event.StakeIntentDeclared._messageHash;
        stakeRequest.messageHash = messageHash;
    });

    it('confirm stake', async () => {
        const block = await originWeb3.eth.getBlock('latest');
        const blockHeight = originWeb3.utils.toHex(block.number);
        const stateRoot = block.stateRoot;
        const outboxProof = await proofUtils.getOutboxProof(
            gateway.address,
            [messageHash],
            blockHeight,
        );

        let tx = await auxiliaryAnchor.anchorStateRoot(
            blockHeight,
            stateRoot,
            { from: auxiliaryAccounts[0] },
        );

        let event = EventDecoder.getEvents(tx, auxiliaryAnchor);
        const expectedBlockHeight = new BN(blockHeight.substring(2), 16);
        stakeRequest.blockHeight = expectedBlockHeight;
        AssertAnchorStateRoot.verify(
            event,
            expectedBlockHeight,
            stateRoot,
        );

        tx = await cogateway.proveGateway(
            blockHeight,
            outboxProof.encodedAccountValue,
            outboxProof.serializedAccountProof,
            { from: auxiliaryAccounts[0] },
        );

        event = EventDecoder.getEvents(tx, cogateway);
        AssertProveGateway.verify(
            event,
            expectedBlockHeight,
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
            blockHeight,
            outboxProof.storageProof[0].serializedProof,
            { from: auxiliaryAccounts[0] },
        );

        event = EventDecoder.getEvents(tx, cogateway);
        AssertConfirmStakeIntent.verify(event, stakeRequest);
    });

    it('progress stake', async () => {
        const initialBalancesBeforeProgress = await assertProgressStake.captureBalances(
            stakeRequest.staker,
        );

        const tx = await gateway.progressStake(
            stakeRequest.messageHash,
            stakeRequest.unlockSecret,
            { from: originAccounts[0] },
        );

        const event = EventDecoder.getEvents(tx, gateway);

        await assertProgressStake.verify(event, stakeRequest, initialBalancesBeforeProgress);
    });

    it('progress mint', async () => {
        const initialBalancesBeforeMint = await
        assertProgressMint.captureBalances(stakeRequest.beneficiary);

        const tx = await cogateway.progressMint(
            stakeRequest.messageHash,
            stakeRequest.unlockSecret,
            { from: auxiliaryAccounts[0] },
        );
        const event = EventDecoder.getEvents(tx, cogateway);

        await assertProgressMint.verify(event, stakeRequest, initialBalancesBeforeMint);
    });
});
