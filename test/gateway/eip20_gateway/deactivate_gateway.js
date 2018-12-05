const Gateway = artifacts.require("./EIP20Gateway.sol")
    , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');


contract('EIP20Gateway.deactivateGateway()', function (accounts) {

    let gateway;
    let organisation = accounts[2];

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

        let coGateway = accounts[5];
        await  gateway.activateGateway(coGateway, {from: organisation});

    });

    it('should deactivate if activated', async function () {

        assert((await gateway.deactivateGateway.call({from: organisation})));
    });

    it('should not deactivate if already deactivated', async function () {

        await gateway.deactivateGateway({from: organisation});
        await Utils.expectRevert(
            gateway.deactivateGateway.call({from: organisation}),
            'Gateway is already deactivated.'
        );
    });

    it('should deactivated by organization only', async function () {

        await Utils.expectRevert(
            gateway.deactivateGateway.call({from: accounts[0]}),
            'Only organisation can call the function.'
        );
    });

});
