'use strict';


const GatewayHelper = function(gateway) {
    const oThis = this;
    oThis.gateway = gateway;
};
GatewayHelper.prototype = {

    // Utils
    getNonce: async function (address) {
        const oThis = this;
        return await oThis.gateway.getNonce.call(address);
    },

    gatewayLinkTypeHash: async function() {
        const oThis = this;
        return await oThis.gateway.gatewayLinkTypeHash.call();
    },

    hashLinkGateway: async function (
        gatewayAddress,
        coGatewayAddress,
        bountyAmount,
        tokenName,
        tokenSymbol,
        tokenDecimals,
        nonce,
        tokenAddress) {

        const oThis = this;
        return await oThis.gateway.hashLinkGateway.call(
            gatewayAddress,
            coGatewayAddress,
            bountyAmount,
            tokenName,
            tokenSymbol,
            tokenDecimals,
            nonce,
            tokenAddress);
    }

};
module.exports = GatewayHelper;
