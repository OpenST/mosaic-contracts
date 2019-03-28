'use strict';

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

const web3 = require('../../../test_lib/web3.js');
const utils = require('../../../test_lib/utils.js');

class CoGatewayUtils {
  /**
   * Generate the redeem intent hash
   *
   * @param {object} amount Redeem amount.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gateway The address of the gateway where the redemption was
   *                         initiated.
   *
   * @return {string} redeem intent hash.
   */
  static hashRedeemIntent(amount, beneficiary, gateway) {
    const redeemIntentTypeHash = utils.getTypeHash(
      'RedeemIntent(uint256 amount,address beneficiary,address gateway)',
    );

    const redeemIntent = web3.utils.sha3(
      web3.eth.abi.encodeParameters(
        ['bytes32', 'uint256', 'address', 'address'],
        [redeemIntentTypeHash, amount.toString(10), beneficiary, gateway],
      ),
    );

    return redeemIntent;
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
}

module.exports = CoGatewayUtils;
