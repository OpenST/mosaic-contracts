'use strict';

const web3 = require('../../../test_lib/web3.js');
const GatewayHelper = require('../../gateway/helpers/helper');

const EIP20GatewayHelper = function(gateway) {
  const oThis = this;
  //Call Super.
  GatewayHelper.apply(oThis, arguments);
  oThis.gateway = gateway;
};

EIP20GatewayHelper.prototype = Object.create(GatewayHelper.prototype);

let proto = {
  constructor: EIP20GatewayHelper,

  stakeTypeHash: async function() {
    const oThis = this;

    return web3.utils.soliditySha3(
      web3.eth.abi.encodeParameter(
        'string',
        'Stake(uint256 amount,address beneficiary,MessageBus.Message message)'
      )
    );
  },

  hashStakingIntent: async function (
    amount,
    beneficiary,
    staker,
    nonce,
    gasPrice,
    gasLimit,
    token) {

    const oThis = this;

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