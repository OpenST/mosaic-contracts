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

const web3 = require('../../../test_lib/web3.js');
const utils = require('../../../test_lib/utils.js');

/**
 * @constructor
 *
 * @param {Object} gateway Gateway contract object.
 * @param {Object} valueToken EIP20 token contract object. This is the value token.
 * @param {Object} baseToken EIP20 token contract object. This is the base token.
 */
class GatewayUtils {
  constructor(gateway, valueToken, baseToken) {
    this.gateway = gateway;
    this.valueToken = valueToken;
    this.baseToken = baseToken;
  }

  /**
   * Generate the stake intent hash
   *
   * @param {object} amount Staking amount.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gateway The address of the gateway where the staking was
   *                         initiated.
   *
   * @return {string} stake intent hash.
   */
  static hashStakeIntent(amount, beneficiary, gateway) {
    const stakeIntentTypeHash = utils.getTypeHash(
      'StakeIntent(uint256 amount,address beneficiary,address gateway)',
    );

    const stakeIntent = web3.utils.sha3(
      web3.eth.abi.encodeParameters(
        ['bytes32', 'uint256', 'address', 'address'],
        [stakeIntentTypeHash, amount.toNumber(), beneficiary, gateway],
      ),
    );

    return stakeIntent;
  }

  /**
   * Get a nonce for an address as currently registered in the gateway.
   *
   * @param {string} address The address for which to get the current nonce.
   *
   * @returns {BN} The current nonce of the given address.
   */
  async getNonce(address) {
    return this.gateway.getNonce.call(address);
  }

  /**
   * Asserts all the conditions for stake
   *
   * @param {Object} params All the input params for calling stake function.
   * @param {Object} resultType Expected result (success or fail).
   * @param {Object} expectedResults Expected results, returns, and events
   *                                 data.
   * @param {Object} txOptions Transaction options.
   *
   */
  async stake(params, resultType, expectedResults, txOptions) {
    const {
      amount,
      beneficiary,
      staker,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    } = params;
    const initialBalance = await this._getBalances(
      staker,
      this.gateway.address,
      txOptions.from,
    );

    const bounty = await this.gateway.bounty.call();

    if (resultType === utils.ResultType.FAIL) {
      await utils.expectThrow(
        this.gateway.stake.call(
          amount,
          beneficiary,
          gasPrice,
          gasLimit,
          nonce,
          hashLock,
          txOptions,
        ),
        expectedResults.errorMessage,
      );
    } else {
      const result = await this.gateway.stake.call(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        txOptions,
      );

      assert.equal(
        result,
        expectedResults.returns.messageHash,
        'messageHash must match',
      );

      const response = await this.gateway.stake(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        txOptions,
      );

      assert.equal(
        response.receipt.status,
        1,
        'Receipt status is unsuccessful',
      );
      const eventData = response.logs;
      utils.validateEvents(eventData, expectedResults.events);
    }

    const finalBalance = await this._getBalances(staker, this.gateway.address);

    await GatewayUtils._assertBalances(
      initialBalance,
      finalBalance,
      amount,
      bounty,
      resultType,
    );
  }

  /**
   * Gets the token balance and base token balance for all the address
   *
   * @param {string} staker Staker address
   * @param {string} gateway Gateway address
   *
   * @return {Object} object containing balances of all the addresses.
   */
  async _getBalances(staker, gateway) {
    const stakerValueTokenBalance = await this.valueToken.balanceOf.call(staker);

    const gatewayValueTokenBalance = await this.valueToken.balanceOf.call(gateway);

    const stakerBaseTokenBalance = await this.baseToken.balanceOf.call(staker);

    const gatewayBaseTokenBalance = await this.baseToken.balanceOf.call(
      gateway,
    );

    const valueTokenBalance = {
      staker: stakerValueTokenBalance,
      gateway: gatewayValueTokenBalance,
    };
    const baseTokenBalance = {
      staker: stakerBaseTokenBalance,
      gateway: gatewayBaseTokenBalance,
    };

    return {
      valueToken: valueTokenBalance,
      baseToken: baseTokenBalance,
    };
  }

  /**
   * Asserts the balances of staker, and gateway
   *
   * @param {Object} initialBalance Initial balances of staker and gateway
   * @param {Object} currentBalance Current balances of staker and gateway
   * @param {Object} stakeAmount Stake amount (in BN)
   * @param {Object} bountyAmount Bounty amount (in BN)
   * @param {Object} resultType expected result FAIL => 0 and SUCCESS => 1
   *
   */
  static async _assertBalances(
    initialBalance,
    currentBalance,
    stakeAmount,
    bountyAmount,
    resultType,
  ) {
    // Assert the balances
    if (resultType === utils.ResultType.FAIL) {
      assert(
        initialBalance.valueToken.staker.eq(currentBalance.valueToken.staker),
        'Staker balance must be unchanged',
      );

      assert(
        initialBalance.valueToken.gateway.eq(currentBalance.valueToken.gateway),
        'Gateway balance must be unchanged',
      );

      assert(
        initialBalance.baseToken.staker.eq(currentBalance.baseToken.staker),
        'Staker balance for base token must be unchanged',
      );

      assert(
        initialBalance.baseToken.gateway.eq(currentBalance.baseToken.gateway),
        'Gateway balance for base token must be unchanged',
      );
    } else {
      assert(
        currentBalance.valueToken.staker.eq(
          initialBalance.valueToken.staker.sub(stakeAmount),
        ),
        `Staker token balance must decrease by ${stakeAmount}`,
      );

      assert(
        initialBalance.valueToken.gateway
          .add(stakeAmount)
          .eq(currentBalance.valueToken.gateway),
        `Gateway token balance must increase by ${stakeAmount}`,
      );

      assert(
        initialBalance.baseToken.gateway
          .add(bountyAmount)
          .eq(currentBalance.baseToken.gateway),
        `Gateway base token balance must create by ${bountyAmount.toString(
          10,
        )}`,
      );

      assert(
        initialBalance.baseToken.staker
          .sub(bountyAmount)
          .eq(currentBalance.baseToken.staker),
        `Staker base token balance must decrease by ${bountyAmount}`,
      );
    }
  }
}

module.exports = GatewayUtils;
