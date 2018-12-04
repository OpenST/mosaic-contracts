'use strict';

const web3 = require('../../test_lib/web3.js');

const GatewayHelper = function(gateway) {
    const oThis = this;
    oThis.gateway = gateway;
};
GatewayHelper.prototype = {


    // Utils
    isAddress: async function (address) {
        return await web3.utils.isAddress(address);
    },

    //Deployment functions
    deployGateway: async function (params, resultType) {

        let valueTokenAddress = params.token,
            bountyToken = params.bountyToken,
            coreAddress = params.core,
            bountyAmount = params.bounty,
            organisationAddress = params.organisation;

        if (resultType === utils.ResultType.FAIL) {
            await utils.expectThrow(Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress
            ));
        } else {
            this.gateway = await Gateway.new(
                valueTokenAddress,
                bountyToken,
                coreAddress,
                bountyAmount,
                organisationAddress
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
    }
};
module.exports = GatewayHelper;
