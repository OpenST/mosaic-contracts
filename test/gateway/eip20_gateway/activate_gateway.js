const Gateway = artifacts.require("./EIP20Gateway.sol")
const MockOrganization = artifacts.require('MockOrganization.sol');

const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('EIP20Gateway.activateGateway()', function (accounts) {

    let gateway;
    let coGateway = accounts[5];
    let owner = accounts[2];
    let worker = accounts[3];
    let organization;
    let burner = NullAddress;

    beforeEach(async function () {

        let mockToken = accounts[0],
            baseToken = accounts[1],
            coreAddress = accounts[2],
            bountyAmount = new BN(100);

        organization = await MockOrganization.new(owner, worker);

        gateway = await Gateway.new(
            mockToken,
            baseToken,
            coreAddress,
            bountyAmount,
            organization.address,
            burner
        );
    });

    it('should activate if not already activated', async function () {

        let isSuccess = await gateway.activateGateway.call(coGateway, { from: owner });

        assert.strictEqual(
            isSuccess,
            true,
            "Gateway activation failed, activateGateway returned false.",
        );

        await gateway.activateGateway(coGateway, { from: owner });
        let isActivated = await gateway.activated.call();

        assert.strictEqual(
            isActivated,
            true,
            'Activation flag is false but expected as true.'
        );

        let actualCoGateway = await gateway.remoteGateway.call();

        assert.strictEqual(
            coGateway,
            actualCoGateway,
            "Actual cogateway address is different from expected address."
        );

        let actualEncodedGatewayPath = await gateway.encodedGatewayPath.call();
        let expectedEncodedGatewayPath = web3.utils.sha3(coGateway);

        assert.strictEqual(
            expectedEncodedGatewayPath,
            actualEncodedGatewayPath,
            "Actual encoded gateway path address is different from expected."
        );

    });

    it('should not activate if already activated', async function () {

        await gateway.activateGateway(coGateway, { from: owner });

        await Utils.expectRevert(
            gateway.activateGateway(coGateway, { from: owner }),
            'Gateway was already activated once.'
        );
    });

    it('should not activate with zero co-gateway address', async function () {

        await Utils.expectRevert(
            gateway.activateGateway(NullAddress, { from: owner }),
            'Co-gateway address must not be zero.'
        );
    });

    it('should be activated by organization only', async function () {

        await Utils.expectRevert(
            gateway.activateGateway(coGateway, { from: accounts[0] }),
            'Only the organization is allowed to call this method.'
        );
    });
});

