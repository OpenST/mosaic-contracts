'use strict';

const web3 = require('../../../test_lib/web3.js');


const EIP20CoGatewayHelper = function() {

};

EIP20CoGatewayHelper.prototype = {
    
    /**
     * It sets the cogateway address.
     */
    setGateway: async function(coGateway) {
    
        this.coGateway = coGateway;
    
    },
    
    /**
     * Generate the stake type hash. This is as per EIP-712
     *
     * @return {string} message type hash.
     */
    redeemTypeHash: async function() {
        return web3.utils.soliditySha3(
            web3.eth.abi.encodeParameter(
                'string',
                'Redeem(uint256 amount,address beneficiary,MessageBus.Message message)'
            )
        );
    },
    
    /**
     * Generate the stake intent hash
     *
     * @param {object} amount Staking amount.
     * @param {string} beneficiary Beneficiary address.
     * @param {string} redeemer Redeemer address.
     * @param {object} nonce Nonce of staker (Big Number).
     * @param {object} gasPrice Gas price (Big Number).
     * @param {object} gasLimit Gas limit (Big Number).
     * @param {string} token EIP20 token address.
     *
     * @return {string} redeem intent hash.
     */
    hashRedeemIntent: async function (
        amount,
        beneficiary,
        redeemer,
        nonce,
        gasPrice,
        gasLimit,
        token) {
        
        return web3.utils.soliditySha3(
            { t: 'uint256', v: amount },
            { t: 'address', v: beneficiary },
            { t: 'address', v: redeemer },
            { t: 'uint256', v: nonce },
            { t: 'uint256', v: gasPrice },
            { t: 'uint256', v: gasLimit },
            { t: 'address', v: token }
        );
    },
    
    getNonce: async function (address) {
        const oThis = this;
        return await oThis.coGateway.getNonce.call(address);
    }
    
};

module.exports = EIP20CoGatewayHelper;
