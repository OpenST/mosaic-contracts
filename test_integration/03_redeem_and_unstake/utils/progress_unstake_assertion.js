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
 * BaseToken(ETH) and token ERC20 balance of gateway, beneficiary and
 * stakeVault.
 * @typedef {Object} Balances
 * @property balances.token.gateway ERC20 balance of gateway contract.
 * @property balances.token.beneficiary ERC20 balance of beneficiary.
 * @property balances.token.stakeVault ERC20 balance of stakeVault contract.
 * @property balances.baseToken.gateway Base token(ETH) balance of gateway.
 * @property balances.baseToken.beneficiary Base token(ETH) balance of beneficiary.
 * @property balances.baseToken.stakeVault Base token(ETH) balance of stakeVault
 */

/**
 * Class to assert event and balances after progress un-stake
 */
class ProgressUnStakeAssertion {
  /** Constructor
     * @param {Object} gateway Truffle gateway instance.
     * @param {Object} token Truffle token instance.
     * @param {Object} baseToken Truffle baseToken instance.
     */
  constructor(gateway, token, baseToken) {
    this.gateway = gateway;
    this.token = token;
    this.baseToken = baseToken;
  }

  /**
     * This verifies event and balances of beneficiary, gateway and stakeVault.
     * @param {Object} event Event object after decoding.
     * @param {RedeemRequest} redeemRequest Redeem request parameters.
     * @param {Balances} initialBalances Initial baseToken and token
     *                                   balances before progress unstake.
     * @param {string} facilitator Address of facilitator.
     */
  async verify(event, redeemRequest, initialBalances, facilitator) {
    await this._assertBalancesForUnStake(
      redeemRequest,
      initialBalances,
      facilitator,
    );

    ProgressUnStakeAssertion._assertProgressUnStakeEvent(event, redeemRequest);
  }

  /**
     * This captures base token and token balance of gateway, beneficiary and
     * stakeVault.
     * @param {string} beneficiary Address of beneficiary.
     * @param {string} facilitator Address of facilitator.
     * @return {Promise<{Balances}>} Base token and token balances.
     */
  async captureBalances(beneficiary, facilitator) {
    const stakeVault = await this.gateway.stakeVault();
    return {
      baseToken: {
        gateway: await this.baseToken.balanceOf(this.gateway.address),
        beneficiary: await this.baseToken.balanceOf(beneficiary),
        stakeVault: await this.baseToken.balanceOf(stakeVault),
        facilitator: await this.baseToken.balanceOf(facilitator),
      },
      token: {
        gateway: await this.token.balanceOf(this.gateway.address),
        beneficiary: await this.token.balanceOf(beneficiary),
        stakeVault: await this.token.balanceOf(stakeVault),
        facilitator: await this.token.balanceOf(facilitator),
      },
    };
  }

  /**
     * This asserts balances of beneficiary, gateway and stakeVault after
     * progress stake.
     * @param {RedeemRequest} redeemRequest Redeem request parameters.
     * @param {Balances} initialBalances Initial balance of beneficiary, gateway and
     *                                   stake vault.
     * @param {string} facilitator Address of facilitator.
     * @private
     */
  async _assertBalancesForUnStake(redeemRequest, initialBalances, facilitator) {
    const finalBalances = await this.captureBalances(
      redeemRequest.beneficiary,
      facilitator,
    );

    const reward = redeemRequest.gasPrice.mul(redeemRequest.gasLimit);
    const unstakeAmount = redeemRequest.amount.sub(reward);

    // Assert gateway balance.
    const expectedGatewayBaseTokenBalance = initialBalances.baseToken.gateway;
    // Gateway base token balance must not change.
    assert.strictEqual(
      expectedGatewayBaseTokenBalance.eq(finalBalances.baseToken.gateway),
      true,
      `Gateway base token balance must be ${expectedGatewayBaseTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.baseToken.gateway.toString(10)}`,
    );

    const expectedGatewayTokenBalance = initialBalances.token.gateway;

    // Assert gateway token balance must not change.
    assert.strictEqual(
      expectedGatewayTokenBalance.eq(finalBalances.token.gateway),
      true,
      `Gateway token balance must be ${expectedGatewayBaseTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.token.gateway.toString(10)}`,
    );

    const expectedbeneficiaryBaseTokenBalance = initialBalances.baseToken.beneficiary;

    // Assert beneficiary base token balance must not change.
    assert.strictEqual(
      expectedbeneficiaryBaseTokenBalance.eq(finalBalances.baseToken.beneficiary),
      true,
      `beneficiary base token balance must be ${expectedbeneficiaryBaseTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.baseToken.beneficiary.toString(10)}`,
    );

    const expectedbeneficiaryTokenBalance = initialBalances.token.beneficiary.add(
      unstakeAmount,
    );

    // Assert beneficiary token balance must increase.
    assert.strictEqual(
      expectedbeneficiaryTokenBalance.eq(finalBalances.token.beneficiary),
      true,
      `beneficiary token balance must be ${expectedbeneficiaryTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.token.beneficiary.toString(10)}`,
    );

    // Assert stake valult balance.
    const expectedStakeVaultTokenBalance = initialBalances.token.stakeVault
      .sub(redeemRequest.amount);

    // Stake vault token balance must reduce.
    assert.strictEqual(
      expectedStakeVaultTokenBalance.eq(finalBalances.token.stakeVault),
      true,
      `Stake value token balance must be ${expectedStakeVaultTokenBalance} instead`
          + ` of ${finalBalances.token.stakeVault}`,
    );

    const expectedStakeVaultBaseTokenBalance = initialBalances.baseToken.stakeVault;
    // Stake vault base token balance must not change.
    assert.strictEqual(
      expectedStakeVaultBaseTokenBalance.eq(finalBalances.baseToken.stakeVault),
      true,
      `Stake vault base token balance must be ${expectedStakeVaultTokenBalance} instead`
          + ` of ${finalBalances.baseToken.stakeVault}`,
    );

    // Assert facilitator balance
    const expectedFacilitatorBaseTokenBalance = initialBalances.baseToken.facilitator;

    assert.strictEqual(
      expectedFacilitatorBaseTokenBalance.eq(finalBalances.baseToken.facilitator),
      true,
      `Facilitator base token balance must be ${expectedFacilitatorBaseTokenBalance} instead `
          + `of ${finalBalances.baseToken.facilitator}`,
    );

    const expectedFacilitatorTokenBalance = initialBalances.token.facilitator.add(reward);

    assert.strictEqual(
      expectedFacilitatorTokenBalance.eq(finalBalances.token.facilitator),
      true,
      `Facilitator token balance must be ${expectedFacilitatorTokenBalance} instead `
          + `of ${finalBalances.token.facilitator}`,
    );
  }

  /**
     * Assert event after progress unstake method.
     * @param {Object} event Object representing unstake progressed event.
     * @param {RedeemRequest} redeemRequest Redeem request parameters.
     * @private
     */
  static _assertProgressUnStakeEvent(event, redeemRequest) {
    const eventData = event.UnstakeProgressed;

    const reward = redeemRequest.gasPrice.mul(redeemRequest.gasLimit);
    assert.strictEqual(
      eventData._messageHash,
      redeemRequest.messageHash,
      'Message hash must match.',
    );
    assert.strictEqual(
      eventData._redeemer,
      redeemRequest.redeemer,
      'Redeemer address must match.',
    );
    assert.strictEqual(
      eventData._beneficiary,
      redeemRequest.beneficiary,
      'beneficiary address must match.',
    );
    assert.strictEqual(
      eventData._redeemAmount.eq(redeemRequest.amount),
      true,
      `Redeem amount from event ${eventData._redeemAmount} must match`
                + `${redeemRequest.amount}`,
    );
    assert.strictEqual(
      eventData._unstakeAmount.eq(redeemRequest.amount.sub(reward)),
      true,
      `Unstake amount from event ${eventData._unstakeAmount} must match`
                + ` ${redeemRequest.amount.sub(reward)}`,
    );
    assert.strictEqual(
      eventData._rewardAmount.eq(reward),
      true,
      `Reward amount from event ${eventData._rewardAmount} must match`
                + `${reward}`,
    );
    assert.strictEqual(
      eventData._proofProgress,
      false,
      'Proof progress flag should be false.',
    );
    assert.strictEqual(
      eventData._unlockSecret,
      redeemRequest.unlockSecret,
      'Unlock secret must match.',
    );
  }
}

module.exports = ProgressUnStakeAssertion;
