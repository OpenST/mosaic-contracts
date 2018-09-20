'use strict';

const Gateway = artifacts.require("Gateway");
const web3 = require("web3");

const utils = require("../../../test/lib/utils");

var gateway;

const GatewayUtils = function() {};
GatewayUtils.prototype = {

    // Utils
    isAddress: async function(address) {
        return await web3.utils.isAddress(address);
    },

    //Deployment functions
    deployGateway: async function(params, resultType) {

        let valueTokenAddress = params.token,
            bountyToken = params.bountyToken,
            coreAddress = params.core,
            bountyAmount = params.bounty,
            organisationAddress = params.organisation;

        const oThis = this;

        if (resultType == utils.ResultType.FAIL) {
            await utils.expectThrow(Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress
            ));
        } else {
            gateway = await Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress
            );

            let addressValidationResult = await oThis.isAddress(gateway.address);

            assert.equal(
                addressValidationResult,
                true,
                "Invalid gateway address"
            );

            let tokenAdd = await gateway.token.call();
            assert.equal(
                tokenAdd,
                valueTokenAddress,
                "Invalid valueTokenAddress address from contract"
            );

            let bountyTokenAdd = await gateway.bountyToken.call();
            assert.equal(
                bountyTokenAdd,
                bountyToken,
                "Invalid bounty token address from contract"
            );

            let coreAdd = await gateway.core.call();
            assert.equal(
                coreAdd,
                coreAddress,
                "Invalid core address from contract"
            );

            let bounty = await gateway.bounty.call();
            assert.equal(
                bounty.toString(10),
                bountyAmount.toString(10),
                "Invalid bounty amount from contract"
            );

            let orgAdd = await gateway.organisation.call();
            assert.equal(
                orgAdd,
                organisationAddress,
                "Invalid organisationAddress address from contract"
            );
        }

        return gateway;
    },

    initiateGatewayLink: async function(
        params,
        resultType,
        expectedResults,
        txOptions ) {

        const oThis = this;

        let coGateway = params.coGateway,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            hashLock = params.hashLock,
            signature = params.signature;

        if (resultType == utils.ResultType.FAIL) {

            await utils.expectThrow(gateway.initiateGatewayLink.call(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            ));
        } else {

            let result = await gateway.initiateGatewayLink.call(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            );

            assert.equal(
                result,
                expectedResults.returns.messageHash,
                "messageHash must match"
            );

            let response = await gateway.initiateGatewayLink(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            );

            assert.equal(
                response.receipt.status,
                1,
                "Receipt status is unsuccessfull"
            );
            let eventData = response.logs;

            oThis.validateEvents(eventData, expectedResults.events);
        }
    },
    
    validateEvents: function (events, expectedData) {
        assert.equal(
            events.length,
            Object.keys(expectedData).length,
            "Number of events emited must match expected event counts"
        );

        events.forEach(function (event) {
            var eventName = event.event;
            var eventData = event.args;
            var eventExpectedData = expectedData[eventName];
            assert.notEqual(eventExpectedData, undefined, "Expected event not found");

            for (var key in eventData) {
                assert.equal(
                    eventData[key],
                    eventExpectedData[key],
                    `Event data ${key} must match the expectedData`
                );
            }
        });

    }
};
module.exports = GatewayUtils;
