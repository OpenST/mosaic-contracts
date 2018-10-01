'use strict';

var Web3 = require('web3'),
    web3 = new Web3("http://localhost:8545");

const GatewayLib = artifacts.require("GatewayLib");

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

        return web3.utils.soliditySha3(
            web3.eth.abi.encodeParameter(
                'string',
                'GatewayLink(bytes32 messageHash,MessageBus.Message message)'
            )
        );
    },

    hashLinkGateway: async function (
        gatewayAddress,
        coGatewayAddress,
        messageBusAddress,
        tokenName,
        tokenSymbol,
        tokenDecimals,
        nonce,
        tokenAddress) {

        const oThis = this;

        let messageBusCode = await web3.eth.getCode(messageBusAddress);
        let messageBusCodeHash = web3.utils.soliditySha3(
            {
                t: 'bytes',
                v: '0x'+messageBusCode.slice(44)
            }
        );

        return web3.utils.soliditySha3(
            { t: 'address', v: gatewayAddress },
            { t: 'address', v: coGatewayAddress },
            { t: 'bytes32', v: messageBusCodeHash },
            { t: 'string', v: tokenName },
            { t: 'string', v: tokenSymbol },
            { t: 'uint8', v: tokenDecimals },
            { t: 'uint256', v: nonce },
            { t: 'address', v: tokenAddress }
        );
    }

};
module.exports = GatewayHelper;
