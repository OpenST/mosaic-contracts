'use strict';

const Gateway = artifacts.require("Gateway");
const web3 = require('../../../test_lib/web3.js');
const utils = require("../../../test_lib/utils");

const GatewayUtils = function(gateway) {
    this.gateway = gateway;
};
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
            organisationAddress = params.organisation,
            messageBusAddress = params.messageBusAddress;

        if (resultType === utils.ResultType.FAIL) {
            await utils.expectThrow(Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress,
                messageBusAddress
            ));
        } else {
            this.gateway = await Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress,
                messageBusAddress
            );

            let addressValidationResult = await this.isAddress(
                this.gateway.address
            );

            assert.equal(
                addressValidationResult,
                true,
                "Invalid gateway address"
            );

            let tokenAdd = await this.gateway.token.call();
            assert.equal(
                tokenAdd,
                valueTokenAddress,
                "Invalid valueTokenAddress address from contract"
            );

            let bountyTokenAdd = await this.gateway.baseToken.call();
            assert.equal(
                bountyTokenAdd,
                bountyToken,
                "Invalid bounty token address from contract"
            );

            let coreAdd = await this.gateway.core.call();
            assert.equal(
                coreAdd,
                coreAddress,
                "Invalid core address from contract"
            );

            let bounty = await this.gateway.bounty.call();
            assert.equal(
                bounty.toString(10),
                bountyAmount.toString(10),
                "Invalid bounty amount from contract"
            );

            let orgAdd = await this.gateway.organisation.call();
            assert.equal(
                orgAdd,
                organisationAddress,
                "Invalid organisationAddress address from contract"
            );
        }

        return this.gateway;
    },

    initiateGatewayLink: async function(
        params,
        resultType,
        expectedResults,
        txOptions ) {

        let coGateway = params.coGateway,
            intentHash = params.intentHash,
            nonce = params.nonce,
            sender = params.sender,
            hashLock = params.hashLock,
            signature = params.signature;

        if (resultType === utils.ResultType.FAIL) {

            await utils.expectThrow(this.gateway.initiateGatewayLink.call(
                coGateway,
                intentHash,
                nonce,
                sender,
                hashLock,
                signature,
                txOptions
            ));
        } else {

            let result = await this.gateway.initiateGatewayLink.call(
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

            let response = await this.gateway.initiateGatewayLink(
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

    let messageHash = params.messageHash,
      unlockSecret = params.unlockSecret;

    if (resultType === utils.ResultType.FAIL) {

      await utils.expectThrow(this.gateway.progressGatewayLink.call(
        messageHash,
        unlockSecret,
        txOptions
      ));

    } else {

      let result = await this.gateway.progressGatewayLink.call(
        messageHash,
        unlockSecret,
        txOptions
      );

      assert.equal(
        result,
        expectedResults.returns.isSuccess,
        "messageHash must match"
      );

      let response = await this.gateway.progressGatewayLink(
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
