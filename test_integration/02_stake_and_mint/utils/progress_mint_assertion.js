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
 * Stake Request object contains all the properties for stake and mint flow.
 * @typedef {Object} StakeRequest
 * @property {BN} amount Stake amount.
 * @property {BN} gasPrice Gas price that staker is ready to pay to get the stake
 *                         and mint process done.
 * @property {BN} gasLimit Gas limit that staker is ready to pay.
 * @property {string} staker Address of stake.
 * @property {BN} bounty Bounty amount paid for stake and mint message
 *                       transfers.
 * @property {BN} nonce Stake nonce.
 * @property {string} beneficiary Address of beneficiary on auxiliary chain.
 * @property {string} hashLock Hash Lock provided by the staker.
 * @property {string} unlockSecret Unlock secret to unlock hash lock.
 * @property {string} messageHash Identifier for stake and mint process.
 * @property {BN} blockHeight Height at which anchor state root is done.
 */

/**
 * BaseToken(ETH) and OST Prime ERC20  balance of beneficiary, ostPrime and
 * coGateway.
 * @typedef {Object} balances
 * @property balances.ostPrime.cogateway OST Prime ERC20 balance of
 *                                       cogateway contract.
 * @property balances.ostPrime.beneficiary OST Prime ERC20 balance of
 *                                         beneficiary.
 * @property balances.ostPrime.ostPrime OST Prime ERC20 balance of
 *                                      ostPrime contract.
 * @property balances.baseToken.cogateway Base token(ETH) balance of
 *                                        cogateway.
 * @property balances.baseToken.beneficiary Base token(ETH) balance of
 *                                          beneficiary.
 * @property balances.baseToken.ostPrime Base token(ETH) balance of ostPrime
 *                                       contract.
 */

/**
 * Class to assert event and balances after progress mint
 */
class ProgressMintAssertion {
  /**
     * Constructor
     * @param {Web3} web3 Auxiliary web3
     * @param {Object} coGateway CoGateway contract instance.
     * @param {Object} ostPrime OSTPrime contract instance.
     */
  constructor(web3, coGateway, ostPrime) {
    this.web3 = web3;
    this.coGateway = coGateway;
    this.ostPrime = ostPrime;
  }

  /**
     * This verifies event and balances.
     *
     * @param {Object} event Event object after decoding.
     * @param {StakeRequest} stakeRequest Stake request.
     * @param {balance} initialBalances Initial baseToken and token balances of
     *                                  beneficiary, ostPrime and coGateway.
     */
  async verify(event, stakeRequest, initialBalances) {
    ProgressMintAssertion._assertProgressMintEvent(event, stakeRequest);

    await this._assertBalancesForMint(stakeRequest, initialBalances);
  }

  /**
     * This captures ERC20 OSTPrime and base token(ETH) balances.
     * @param {string} beneficiary
     * @return {Promise<balances>} Balances before progress mint.
     */
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
     * @param {StakeRequest} stakeRequest Stake request parameters.
     * @param {balances} initialBalances Balances of beneficiary, ostPrime and
     *                                   coGateway before progress mint.
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
      `Expected beneficiary base token balance ${expectedBeneficiaryBalance}`
           + ` instead found ${finalBalances.baseToken.beneficiary} `,
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
      `Extend ost prime base token balance ${expectedBaseTokenOSTPrimeBalance}`
           + ` instead found ${finalBalances.baseToken.ostPrime} `,
    );

    const expectedOSTPrimeContractERC20Balance = initialBalances.ostPrime.ostPrime
      .add(reward.add(mintedAmount));

    assert.strictEqual(
      expectedOSTPrimeContractERC20Balance.eq(finalBalances.ostPrime.ostPrime),
      true,
      `Expected OST Prime contract ERC20 balance is ${expectedOSTPrimeContractERC20Balance}`
            + ` instead found ${finalBalances.ostPrime.ostPrime}`,
    );

    // Assert CoGateway balance
    assert.strictEqual(
      initialBalances.baseToken.cogateway.eq(finalBalances.baseToken.cogateway),
      true,
      `CoGateway initial base token balance ${initialBalances.baseToken.cogateway}`
          + ` should be equal to final balance ${finalBalances.baseToken.cogateway}`,
    );

    assert.strictEqual(
      initialBalances.ostPrime.cogateway.eq(finalBalances.ostPrime.cogateway),
      true,
      `CoGateway initial ost prime ERC20 token balance ${initialBalances.ostPrime.cogateway}`
          + ` should be equal to final balance ${finalBalances.ostPrime.cogateway}`,
    );
  }

  /**
     * This asserts event after progress mint.
     * @param {Object} event Object representing mint progressed event.
     * @param {stakeRequest} stakeRequest Stake request parameters.
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

  /**
     * Returns ETH balance wrapped in BN.
     * @param {string} address Address for which balance is requested.
     * @return {Promise<BN>} ETH Balance.
     * @private
     */
  async _getEthBalance(address) {
    const balance = await this.web3.eth.getBalance(address);
    return new BN(balance);
  }
}

module.exports = ProgressMintAssertion;
