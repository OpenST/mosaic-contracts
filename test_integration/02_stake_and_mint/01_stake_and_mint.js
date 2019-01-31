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
const AssertConfirmStakeIntent = require('./utils/assert_confirm_stake_intent');
const AssertProgressStake = require('./utils/assert_progress_stake');
const AssertProgressMint = require('./utils/assert_progress_mint');
const ProofUtils = require('./utils/proof_utils');
const Anchor = require('./utils/anchor');

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
    let stakeRequest;

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

        assertStake = new AssertStake(gateway, token, baseToken);
        assertProgressStake = new AssertProgressStake(gateway, token, baseToken);
        assertProgressMint = new AssertProgressMint(auxiliaryWeb3, cogateway, ostPrime);
        proofUtils = new ProofUtils(originWeb3, auxiliaryWeb3);
        auxiliaryAnchor = new Anchor(
            originWeb3,
            shared.auxiliary.contracts.Anchor,
        );
    });

    it('stake', async () => {
        // Capture initial token and base token balance of staker and gateway.
        const initialBalances = await assertStake.captureBalances(stakeRequest.staker);
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
        // Assert event and balances.
        await assertStake.verify(event, stakeRequest, initialBalances);

        stakeRequest.messageHash = event.StakeIntentDeclared._messageHash;
    });

    it('confirm stake', async () => {
        // Anchor state root.
        const blockNumber = await auxiliaryAnchor.anchorStateRoot(
            'latest',
            auxiliaryAccounts[0],
        );
        // Generate outbox proof for block height for which state root is
        // anchored.
        const outboxProof = await proofUtils.getOutboxProof(
            gateway.address,
            [stakeRequest.messageHash],
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
        AssertProveGateway.verify(
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
        AssertConfirmStakeIntent.verify(event, stakeRequest);
    });

    it('progress stake', async () => {
        // Capture initial token and base token balance of staker and gateway.
        const initialBalancesBeforeProgress = await assertProgressStake.captureBalances(
            stakeRequest.staker,
        );

        const tx = await gateway.progressStake(
            stakeRequest.messageHash,
            stakeRequest.unlockSecret,
            { from: originAccounts[0] },
        );

        const event = EventDecoder.getEvents(tx, gateway);
        // Assert event and balances.
        await assertProgressStake.verify(event, stakeRequest, initialBalancesBeforeProgress);
    });

    it('progress mint', async () => {
        // Capture initial OST prime ERC20 and base token balance of
        // beneficiary, OST prime contract address and gateway.
        const initialBalancesBeforeMint = await assertProgressMint.captureBalances(
            stakeRequest.beneficiary,
        );

        const tx = await cogateway.progressMint(
            stakeRequest.messageHash,
            stakeRequest.unlockSecret,
            { from: auxiliaryAccounts[0] },
        );
        const event = EventDecoder.getEvents(tx, cogateway);

        // Assert event and balances.
        await assertProgressMint.verify(event, stakeRequest, initialBalancesBeforeMint);
    });
});
