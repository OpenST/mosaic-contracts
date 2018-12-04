const Gateway = artifacts.require("./EIP20Gateway.sol")
    , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');


contract('GatewayBase.sol', function (accounts) {

    describe('Deactivate gateway', async () => {
        let gatewayBaseInstance;
        let organisation = accounts[2];

        beforeEach(async function () {

            let mockToken = accounts[0],
                baseToken = accounts[1],
                coreAddress = accounts[2],
                bountyAmount = new BN(100);

            gatewayBaseInstance = await Gateway.new(
                mockToken,
                baseToken,
                coreAddress,
                bountyAmount,
                organisation
            );

            let coGateway = accounts[5];
            await  gatewayBaseInstance.activateGateway(coGateway, {from: organisation});

        });

        it('should deactivate if activated', async function () {

            assert((await gatewayBaseInstance.deactivateGateway.call({from: organisation})));
        });

        it('should not deactivate if already deactivated', async function () {

            await gatewayBaseInstance.deactivateGateway({from: organisation});
            await Utils.expectThrow(gatewayBaseInstance.deactivateGateway.call({from: organisation}));
        });

        it('should deactivated by organization only', async function () {

            await Utils.expectThrow(gatewayBaseInstance.deactivateGateway.call({from: accounts[0]}));
        });

    });

    describe('Activate  Gateway', async () => {
        let gatewayBaseInstance;
        let organisation = accounts[2];
        let coGateway = accounts[5];

        beforeEach(async function () {
            let mockToken = accounts[0],
                baseToken = accounts[1],
                coreAddress = accounts[2],
                bountyAmount = new BN(100);

            gatewayBaseInstance = await Gateway.new(
                mockToken,
                baseToken,
                coreAddress,
                bountyAmount,
                organisation
            );
        });

        it('should activate if deActivated', async function () {

            assert(
                (await gatewayBaseInstance.activateGateway.call(coGateway, {from: organisation})),
                "Gateway activation failed, activateGateway returned false.",
            );
        });

        it('should not activate if already activated', async function () {

            await gatewayBaseInstance.activateGateway(coGateway, {from: organisation});
            await Utils.expectThrow(gatewayBaseInstance.activateGateway.call(coGateway, {from: organisation}));
        });

        it('should be activated by organization only', async function () {

            await Utils.expectThrow(gatewayBaseInstance.activateGateway.call(coGateway, {from: accounts[0]}));
        });

    });

});
