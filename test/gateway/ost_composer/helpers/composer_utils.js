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

/**
 * Stake Request object contains all the properties needed for generating stake request hash.
 * @typedef {Object} StakeRequest
 * @property {BN} amount Stake amount.
 * @property {string} beneficiary Address of beneficiary on auxiliary chain.
 * @property {BN} gasPrice Gas price that staker is ready to pay to get the stake
 *                         and mint process done.
 * @property {BN} gasLimit Gas limit that staker is ready to pay.
 * @property {BN} nonce Stake nonce.
 * @property {string} staker Address of staker.
 */

const EthUtils = require('ethereumjs-util');
const web3 = require('../../../test_lib/web3.js');

class ComposerUtils {

  /**
   * Generates stake request hash.
   *
   * @param {object} stakeRequest StakeRequest object
   * @param {string} gateway Gateway contract address.
   * @param {string} ostComposer OSTComposer contract address.
   * @return {string} Stake request hash.
   */
  static getStakeRequestHash(stakeRequest, gateway, ostComposer) {
    const stakeRequestMethod = 'StakeRequest(uint256 amount,address beneficiary,uint256 gasPrice,uint256 gasLimit,uint256 nonce,address staker,address gateway)';
    const encodedTypeHash = web3.utils.sha3(web3.eth.abi.encodeParameter('string', stakeRequestMethod));

    const stakeIntentTypeHash = web3.utils.soliditySha3(
      { type: 'bytes32', value: encodedTypeHash },
      { type: 'uint256', value: stakeRequest.amount },
      { type: 'address', value: stakeRequest.beneficiary },
      { type: 'uint256', value: stakeRequest.gasPrice },
      { type: 'uint256', value: stakeRequest.gasLimit },
      { type: 'uint256', value: stakeRequest.nonce },
      { type: 'address', value: stakeRequest.staker },
      { type: 'address', value: gateway },
    );

    const EIP712_DOMAIN_TYPEHASH = web3.utils.soliditySha3(
      'EIP712Domain(address verifyingContract)',
    );
    const DOMAIN_SEPARATOR = web3.utils.soliditySha3(
      web3.eth.abi.encodeParameters(
        ['bytes32', 'address'],
        [EIP712_DOMAIN_TYPEHASH, ostComposer],
      ),
    );

    const eip712TypeData = EthUtils.keccak(
      Buffer.concat(
        [
          Buffer.from('19', 'hex'),
          Buffer.from('01', 'hex'),
          EthUtils.toBuffer(DOMAIN_SEPARATOR),
          EthUtils.toBuffer(stakeIntentTypeHash),
        ],
      ),
    );

    return EthUtils.bufferToHex(eip712TypeData);
  }
}

module.exports = ComposerUtils;
