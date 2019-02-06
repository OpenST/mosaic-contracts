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
 * Redeem Request object contains all the properties for redeem and unStake.
 * @typedef {Object} RedeemRequest
 * @property {BN} amount Redeem amount.
 * @property {BN} gasPrice Gas price that Redeemer is ready to pay to get the
 *                         redeem and unStake process done.
 * @property {BN} gasLimit Gas limit that redeemer is ready to pay.
 * @property {string} redeemer Address of Redeemer.
 * @property {BN} bounty Bounty amount paid for redeem and unstake message
 *                       transfers.
 * @property {BN} nonce Redeem nonce.
 * @property {string} beneficiary Address of beneficiary on origin chain.
 * @property {string} hashLock Hash Lock provided by the redeemer.
 * @property {string} unlockSecret Unlock secret to unlock hash lock.
 * @property {string} messageHash Identifier for redeem and unstake process.
 * @property {BN} blockHeight Height at which anchor state root is done.
 */

/**
 * Class to assert confirm redeem intent.
 */
class ConfirmRedeemIntentAssertion {
  /**
     * This verifies event.
     * @param {Object} event Event object after decoding.
     * @param {RedeemRequest} redeemRequest Redeem request parameters.
     */
  static verify(event, redeemRequest) {
    const eventData = event.RedeemIntentConfirmed;

    assert.strictEqual(
      eventData._messageHash,
      redeemRequest.messageHash,
      `Message hash from event must be equal to ${redeemRequest.messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      redeemRequest.redeemer,
      `Redeemer address from event must be equal to ${redeemRequest.redeemer}.`,
    );

    assert.strictEqual(
      redeemRequest.nonce.eq(eventData._redeemerNonce),
      true,
      `Redeem nonce from event must be equal to ${redeemRequest.nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      redeemRequest.beneficiary,
      `Beneficiary address from event must be equal to ${redeemRequest.beneficiary}.`,
    );

    assert.strictEqual(
      redeemRequest.amount.eq(eventData._amount),
      true,
      `Amount from event must be equal to ${redeemRequest.amount.toString(10)}.`,
    );

    assert.strictEqual(
      redeemRequest.blockHeight.eq(eventData._blockHeight),
      true,
      `Block height from event must be equal to ${redeemRequest.blockHeight.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._hashLock,
      redeemRequest.hashLock,
      `Hash lock from event must be equal to ${redeemRequest.hashLock}.`,
    );
  }
}

module.exports = ConfirmRedeemIntentAssertion;
