const GatewayBase = artifacts.require("./GatewayBase.sol")
    , BN = require('bn.js');

const MockMembersManager = artifacts.require('MockMembersManager.sol');
const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('GatewayBase.constructor()', function (accounts) {

    let core, bounty, worker, membersManager, burner = NullAddress;

    beforeEach(async function () {

        owner = accounts[2]
            , worker = accounts[3]
            , core = accounts[0]
            , bounty = new BN(100);

        membersManager = await MockMembersManager.new(owner, worker);
    });

    it('should pass with right set of parameters', async function () {
        gatewayBaseInstance = await GatewayBase.new(
            core,
            bounty,
            membersManager.address,
            burner
        );

        assert.strictEqual(
            core,
            await gatewayBaseInstance.core.call(),
            "Core contract address doesn't match."
        );
        assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should pass with right set of parameters and zero bounty', async function () {

        bounty = new BN(0);

        gatewayBaseInstance = await GatewayBase.new(
            core,
            bounty,
            membersManager.address,
            burner
        );

        assert.equal(core, await gatewayBaseInstance.core.call());
        assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should fail if core address is not passed', async function () {

        core = NullAddress;
        await Utils.expectRevert(
            GatewayBase.new(core, bounty, membersManager.address, burner),
            "Core contract address must not be zero."
        );

    });

    it('should fail if worker manager address is not passed', async function () {

        await Utils.expectRevert(
            GatewayBase.new(core, bounty, NullAddress, burner),
            "MembersManager contract address must not be address\\(0\\)."
        );

    });
});
