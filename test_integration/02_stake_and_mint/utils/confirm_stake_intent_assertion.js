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

/**
 *  Class to assert confirm stake intent.
 */
class ConfirmStakeIntentAssertion {
    /**
     *  This verifies event.
     *
     * @param event Event object after decoding.
     * @param stakeRequest Stake request. {amount: *, gasPrice: *,gasLimit:*
     * , hashLock: *, unlockSecret:*, staker:*, bounty:*, nonce:*,
      * beneficiary:*}
     *
     */
    static verify(event, stakeRequest) {
        const eventData = event.StakeIntentConfirmed;

        assert.strictEqual(
            eventData._messageHash,
            stakeRequest.messageHash,
            `Message hash from event must be equal to ${stakeRequest.messageHash}.`,
        );

        assert.strictEqual(
            eventData._staker,
            stakeRequest.staker,
            `Staker address from event must be equal to ${stakeRequest.staker}.`,
        );

        assert.strictEqual(
            stakeRequest.nonce.eq(eventData._stakerNonce),
            true,
            `Staker nonce from event must be equal to ${stakeRequest.nonce.toString(10)}.`,
        );

        assert.strictEqual(
            eventData._beneficiary,
            stakeRequest.beneficiary,
            `Beneficiary address from event must be equal to ${stakeRequest.beneficiary}.`,
        );

        assert.strictEqual(
            stakeRequest.amount.eq(eventData._amount),
            true,
            `Amount from event must be equal to ${stakeRequest.amount.toString(10)}.`,
        );

        assert.strictEqual(
            stakeRequest.blockHeight.eq(eventData._blockHeight),
            true,
            `Block height from event must be equal to ${stakeRequest.blockHeight.toString(10)}.`,
        );

        assert.strictEqual(
            eventData._hashLock,
            stakeRequest.hashLock,
            `Hash lock from event must be equal to ${stakeRequest.hashLock}.`,
        );
    }
}

module.exports = ConfirmStakeIntentAssertion;
