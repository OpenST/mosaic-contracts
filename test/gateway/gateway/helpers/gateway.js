'use strict';

const Gateway = artifacts.require("Gateway");
const web3 = require('../../../test_lib/web3.js');
const utils = require("../../../test_lib/utils");

const GatewayUtils = function(gateway) {
    const oThis = this;
    oThis.gateway = gateway;
};
GatewayUtils.prototype = {

    // Utils
    isAddress: async function(address) {
        return await web3.utils.isAddress(address);
    },

    //Deployment functions
    deployGateway: async function(params, resultType) {
        const oThis = this;

        let valueTokenAddress = params.token,
            bountyToken = params.bountyToken,
            coreAddress = params.core,
            bountyAmount = params.bounty,
            organisationAddress = params.organisation,
            messageBusAddress = params.messageBusAddress;

        if (resultType == utils.ResultType.FAIL) {
            await utils.expectThrow(Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress,
                messageBusAddress
            ));
        } else {
            oThis.gateway = await Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress,
                messageBusAddress
            );

            let addressValidationResult = await oThis.isAddress(
                oThis.gateway.address
            );

            assert.equal(
                addressValidationResult,
                true,
                "Invalid gateway address"
            );

            let tokenAdd = await oThis.gateway.token.call();
            assert.equal(
                tokenAdd,
                valueTokenAddress,
                "Invalid valueTokenAddress address from contract"
            );

            let bountyTokenAdd = await oThis.gateway.baseToken.call();
            assert.equal(
                bountyTokenAdd,
                bountyToken,
                "Invalid bounty token address from contract"
            );

            let coreAdd = await oThis.gateway.core.call();
            assert.equal(
                coreAdd,
                coreAddress,
                "Invalid core address from contract"
            );

            let bounty = await oThis.gateway.bounty.call();
            assert.equal(
                bounty.toString(10),
                bountyAmount.toString(10),
                "Invalid bounty amount from contract"
            );

            let orgAdd = await oThis.gateway.organisation.call();
            assert.equal(
                orgAdd,
                organisationAddress,
                "Invalid organisationAddress address from contract"
            );
        }

        return oThis.gateway;
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

            await utils.expectThrow(oThis.gateway.initiateGatewayLink.call(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            ));
        } else {

            let result = await oThis.gateway.initiateGatewayLink.call(
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

            let response = await oThis.gateway.initiateGatewayLink(
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
                "Receipt status is unsuccessful"
            );
            let eventData = response.logs;

            utils.validateEvents(eventData, expectedResults.events);
        }
    },

  progressGatewayLink: async function(
    params,
    resultType,
    expectedResults,
    txOptions ) {

    const oThis = this;

    let messageHash = params.messageHash,
      unlockSecret = params.unlockSecret;

    if (resultType == utils.ResultType.FAIL) {

      await utils.expectThrow(oThis.gateway.progressGatewayLink.call(
        messageHash,
        unlockSecret,
        txOptions
      ));

    } else {

      let result = await oThis.gateway.progressGatewayLink.call(
        messageHash,
        unlockSecret,
        txOptions
      );

      assert.equal(
        result,
        expectedResults.returns.isSuccess,
        "messageHash must match"
      );

      let response = await oThis.gateway.progressGatewayLink(
        messageHash,
        unlockSecret,
        txOptions
      );

      assert.equal(
        response.receipt.status,
        1,
        "Receipt status is unsuccessful"
      );
      let eventData = response.logs;
      utils.validateEvents(eventData, expectedResults.events);
    }
  }
};
module.exports = GatewayUtils;
