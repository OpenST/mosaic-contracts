const Gateway = artifacts.require("./EIP20Gateway.sol")
const MockMembersManager = artifacts.require('MockMembersManager.sol');

const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils');


contract('EIP20Gateway.(de)activateGateway()', function (accounts) {

    let gateway;
    let coGateway = accounts[5];
    let owner = accounts[2];
    let worker = accounts[3];
    let membersManager;

    beforeEach(async function () {

        let mockToken = accounts[0],
            baseToken = accounts[1],
            coreAddress = accounts[2],
            bountyAmount = new BN(100);

        membersManager = await MockMembersManager.new(owner, worker);

        gateway = await Gateway.new(
            mockToken,
            baseToken,
            coreAddress,
            bountyAmount,
            membersManager.address
        );
    });

    it('should deactivate if activated', async function () {

        await gateway.activateGateway(coGateway, { from: owner });
        assert((await gateway.deactivateGateway.call({ from: owner })));
        await gateway.deactivateGateway({ from: owner });
        assert(
            !(await gateway.activated.call()),
            'Activation flag is true but expected as false.'
        );
    });

    it('should not deactivate if already deactivated', async function () {

        await gateway.activateGateway(coGateway, { from: owner });
        await gateway.deactivateGateway({ from: owner });
        await Utils.expectThrow(gateway.deactivateGateway.call({ from: owner }));
    });

    it('should deactivated by organization only', async function () {

        await gateway.activateGateway(coGateway, { from: owner });
        await Utils.expectThrow(gateway.deactivateGateway.call({ from: accounts[0] }));
    });

    it('should activate if deActivated', async function () {

        assert(
            (await gateway.activateGateway.call(coGateway, {from: owner})),
            "Gateway activation failed, activateGateway returned false.",
        );

        await gateway.activateGateway(coGateway, {from: owner});

        assert(
            (await gateway.activated.call()),
            'Activation flag is false but expected as true.'
        );
    });

    it('should not activate if already activated', async function () {

        await gateway.activateGateway(coGateway, {from: owner});
        await Utils.expectRevert(
            gateway.activateGateway.call(coGateway, {from: owner}),
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

