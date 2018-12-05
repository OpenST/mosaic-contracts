const Gateway = artifacts.require("./EIP20Gateway.sol")
    , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');

contract('EIP20Gateway.activateGateway()', function (accounts) {
    let gateway;
    let organisation = accounts[2];
    let coGateway = accounts[5];

    beforeEach(async function () {
        let mockToken = accounts[0],
            baseToken = accounts[1],
            coreAddress = accounts[2],
            bountyAmount = new BN(100);

        gateway = await Gateway.new(
            mockToken,
            baseToken,
            coreAddress,
            bountyAmount,
            organisation
        );
    });

    it('should activate if deActivated', async function () {

        assert(
            (await gateway.activateGateway.call(coGateway, {from: organisation})),
            "Gateway activation failed, activateGateway returned false.",
        );
    });

    it('should not activate if already activated', async function () {

        await gateway.activateGateway(coGateway, {from: organisation});
        await Utils.expectRevert(
            gateway.activateGateway.call(coGateway, {from: organisation}),
            'Gateway was already activated once.'
        );
    });

    it('should be activated by organization only', async function () {

        await Utils.expectRevert(
            gateway.activateGateway.call(coGateway, {from: accounts[0]}),
            'Only organisation can call the function.'
        );
    });
});

