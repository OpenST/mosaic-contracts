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

const assert = require('assert');
const BN = require('bn.js');

/**
 *  Class to assert event and balances after progress mint
 */
class AssertProgressMint {
    /**
     *
     * @param web3 Auxiliary web3
     * @param coGateway
     * @param ostPrime
     */
    constructor(web3, coGateway, ostPrime) {
        this.web3 = web3;
        this.coGateway = coGateway;
        this.ostPrime = ostPrime;
    }

    /**
     *  This verifies event and balances.
     *
     * @param event Event object after decoding.
     * @param stakeRequest Stake request. {amount: *, gasPrice: *,gasLimit:*
     * , hashLock: *, unlockSecret:*, staker:*, bounty:*, nonce:*,
      * beneficiary:*}
     *
     * @param initialBalances Initial baseToken and token balances
     */
    async verify(event, stakeRequest, initialBalances) {
        AssertProgressMint._assertProgressMintEvent(event, stakeRequest);

        await this._assertBalancesForMint(stakeRequest, initialBalances);
    }


    async captureBalances(beneficiary) {
        return {
            ostPrime: {
                cogateway: await this.ostPrime.balanceOf(this.coGateway.address),
                beneficiary: await this.ostPrime.balanceOf(beneficiary),
                ostPrime: await this.ostPrime.balanceOf(this.ostPrime.address),
            },
            baseToken: {
                cogateway: await this._getEthBalance(this.coGateway.address),
                beneficiary: await this._getEthBalance(beneficiary),
                ostPrime: await this._getEthBalance(this.ostPrime.address),
            },
        };
    }

    /**
     * This asserts balances of beneficiary, ostPrime and coGateway after
     * progress mint.
     * @param stakeRequest
     * @param initialBalances Initial balance of beneficiary, ostPrime and coGateway
     *                        by captureBalances method.
     * @private
     */
    async _assertBalancesForMint(stakeRequest, initialBalances) {
        const finalBalances = await this.captureBalances(stakeRequest.beneficiary);

        const reward = stakeRequest.gasPrice.mul(stakeRequest.gasLimit);
        const mintedAmount = stakeRequest.amount.sub(reward);

        // Assert beneficiary balances
        const expectedBeneficiaryBalance = initialBalances.baseToken.beneficiary.add(mintedAmount);
        assert.strictEqual(
            expectedBeneficiaryBalance.eq(finalBalances.baseToken.beneficiary),
            true,
            `Expected beneficiary base token balance ${expectedBeneficiaryBalance}
           instead found ${finalBalances.baseToken.beneficiary} `,
        );

        assert.strictEqual(
            initialBalances.ostPrime.beneficiary.eq(finalBalances.ostPrime.beneficiary),
            true,
            'Beneficiary OST prime balance must not change',
        );

        // Assert ost prime balance
        const expectedBaseTokenOSTPrimeBalance = initialBalances.baseToken.ostPrime
            .sub(stakeRequest.amount);

        assert.strictEqual(
            expectedBaseTokenOSTPrimeBalance.eq(finalBalances.baseToken.ostPrime),
            true,
            `Extend ost prime base token balance ${expectedBaseTokenOSTPrimeBalance}
           instead found ${finalBalances.baseToken.ostPrime} `,
        );

        const expectedOSTPrimeContractERC20Balance = initialBalances.ostPrime.ostPrime
            .add(reward.add(mintedAmount));

        assert.strictEqual(
            expectedOSTPrimeContractERC20Balance.eq(finalBalances.ostPrime.ostPrime),
            true,
            `Expected OST Prime contract ERC20 balance is ${expectedOSTPrimeContractERC20Balance}
            instead found ${finalBalances.ostPrime.ostPrime}`,
        );

        // Assert CoGateway balance
        assert.strictEqual(
            initialBalances.baseToken.cogateway.eq(finalBalances.baseToken.cogateway),
            true,
            `CoGateway initial base token balance ${initialBalances.baseToken.cogateway}
          should be equal to final balance ${finalBalances.baseToken.cogateway}`,
        );

        assert.strictEqual(
            initialBalances.ostPrime.cogateway.eq(finalBalances.ostPrime.cogateway),
            true,
            `CoGateway initial ost prime ERC20 token balance ${initialBalances.ostPrime.cogateway}
          should be equal to final balance ${finalBalances.ostPrime.cogateway}`,
        );
    }

    /**
     * This asserts event after progress mint.
     * @param event
     * @param stakeRequest
     * @private
     */
    static _assertProgressMintEvent(event, stakeRequest) {
        const eventData = event.MintProgressed;

        const reward = stakeRequest.gasPrice.mul(stakeRequest.gasLimit);
        const mintedAmount = stakeRequest.amount.sub(reward);

        assert.strictEqual(
            eventData._messageHash,
            stakeRequest.messageHash,
            'Message hash must match.',
        );
        assert.strictEqual(
            eventData._staker,
            stakeRequest.staker,
            'Staker address must match.',
        );
        assert.strictEqual(
            eventData._beneficiary,
            stakeRequest.beneficiary,
            'Beneficiary address must match.',
        );
        assert.strictEqual(
            eventData._stakeAmount.eq(stakeRequest.amount),
            true,
            `Expected Stake amount ${stakeRequest.amount} but actual amount ${eventData._stakeAmount}.`,
        );

        assert.strictEqual(
            eventData._mintedAmount.eq(mintedAmount),
            true,
            `Expected Minted amount ${mintedAmount} but actual amount ${eventData._mintedAmount}.`,
        );
        assert.strictEqual(
            eventData._rewardAmount.eq(reward),
            true,
            `Expected reward amount ${reward} but actual amount ${eventData._rewardAmount}.`,
        );
        assert.strictEqual(
            eventData._proofProgress,
            false,
            'Proof progress flag should be false.',
        );
        assert.strictEqual(
            eventData._unlockSecret,
            stakeRequest.unlockSecret,
            'Unlock secret must match.',
        );
    }

    async _getEthBalance(address) {
        const balance = await this.web3.eth.getBalance(address);
        return new BN(balance);
    }
}

module.exports = AssertProgressMint;
