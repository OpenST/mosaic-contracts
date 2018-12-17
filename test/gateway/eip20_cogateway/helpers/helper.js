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

'use strict';

const web3 = require('../../../test_lib/web3.js');


const EIP20CoGatewayHelper = function () {

};

EIP20CoGatewayHelper.prototype = {
  
  /**
   * It sets the cogateway address.
   * @param coGateway CoGateway contract address.
   */
  setCoGateway: async function (coGateway)
  {
    
    this.coGateway = coGateway;
    
  },
  
  /**
   * Generate the redeem type hash. This is as per EIP-712.
   *
   * @return {string} Message type hash.
   */
  redeemTypeHash: async function ()
  {
    return web3.utils.soliditySha3(
      'string',
      'Redeem(uint256 amount,address beneficiary,MessageBus.Message message)'
    );
  },
  
  /**
   * Generate the redeem intent hash.
   *
   * @param {object} amount Redeem amount.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} redeemer Redeemer address.
   * @param {object} nonce Nonce of staker (Big Number).
   * @param {object} gasPrice Gas price (Big Number).
   * @param {object} gasLimit Gas limit (Big Number).
   * @param {string} token EIP20 token address.
   *
   * @return {string} Redeem intent hash.
   */
  hashRedeemIntent: async function (
    amount,
    beneficiary,
    redeemer,
    nonce,
    gasPrice,
    gasLimit,
    token)
  {
    
    return web3.utils.soliditySha3(
      {t: 'uint256', v: amount},
      {t: 'address', v: beneficiary},
      {t: 'address', v: redeemer},
      {t: 'uint256', v: nonce},
      {t: 'uint256', v: gasPrice},
      {t: 'uint256', v: gasLimit},
      {t: 'address', v: token}
    );
  },
  
  /**
   * It returns the nonce value for the account address.
   *
   * @param address Account for which nonce is required.
   *
   * @returns {Promise<void>} Nonce of the address.
   */
  getNonce: async function (address)
  {
    
    return await this.coGateway.getNonce.call(address);
  }
  
};

module.exports = EIP20CoGatewayHelper;
