'use strict';

const web3 = require('../../../test_lib/web3.js');
const GatewayHelper = require('../../gateway/helpers/helper');

const EIP20GatewayHelper = function(gateway) {
  //Call Super.
  GatewayHelper.apply(this, arguments);
  this.gateway = gateway;
};

EIP20GatewayHelper.prototype = Object.create(GatewayHelper.prototype);

let proto = {
  constructor: EIP20GatewayHelper,

  /**
   * Generate the stake type hash. This is as per EIP-712
   *
   * @return {string} message type hash.
   */
  stakeTypeHash: async function() {
    return web3.utils.soliditySha3(
      web3.eth.abi.encodeParameter(
        'string',
        'Stake(uint256 amount,address beneficiary,MessageBus.Message message)'
      )
    );
  },

  /**
   * Generate the staking intent hash
   *
   * @param {object} amount Staking amount.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} staker Staker address.
   * @param {object} nonce Nonce of staker (Big Number).
   * @param {object} gasPrice Gas price (Big Number).
   * @param {object} gasLimit Gas limit (Big Number).
   * @param {string} token EIP20 token address.
   *
   * @return {string} staking intent hash.
   */
  hashStakingIntent: async function (
    amount,
    beneficiary,
    staker,
    nonce,
    gasPrice,
    gasLimit,
    token) {

    return web3.utils.soliditySha3(
      { t: 'uint256', v: amount },
      { t: 'address', v: beneficiary },
      { t: 'address', v: staker },
      { t: 'uint256', v: nonce },
      { t: 'uint256', v: gasPrice },
      { t: 'uint256', v: gasLimit },
      { t: 'address', v: token }
    );
  }

};

Object.assign(EIP20GatewayHelper.prototype, proto);

module.exports = EIP20GatewayHelper;
