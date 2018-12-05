const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const MockOrganization = artifacts.require('MockOrganization.sol');
const Utils = require('../../../test/test_lib/utils');


contract('GatewayBase.sol', function (accounts) {

  describe('Deactivate gateway', async () => {
    let gatewayBaseInstance;
    let organizationOwner = accounts[2];
    let worker = accounts[3];

    beforeEach(async function () {

      let core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);

      let organization = await MockOrganization.new(organizationOwner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        organization.address
      );

    });

    it('should deactivate if activated', async function () {

      assert((await gatewayBaseInstance.deactivateGateway.call({ from: organizationOwner })));
    });

    it('should not deactivate if already deactivated', async function () {

      await gatewayBaseInstance.deactivateGateway({ from: organizationOwner });
      await Utils.expectThrow(gatewayBaseInstance.deactivateGateway.call({ from: organizationOwner }));
    });

    it('should deactivated by organization only', async function () {

      await Utils.expectThrow(gatewayBaseInstance.deactivateGateway.call({ from: accounts[0] }));
    });

  });

  describe('Activate  Gateway', async () => {
    let gatewayBaseInstance;
    let organizationOwner = accounts[2];
    let worker = accounts[3];

    beforeEach(async function () {
      let core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);

      let organization = await MockOrganization.new(organizationOwner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        organization.address
      );

      await gatewayBaseInstance.deactivateGateway({ from: organizationOwner });
    });

    it('should activate if deActivated', async function () {

      assert(
        (await gatewayBaseInstance.activateGateway.call({ from: organizationOwner })),
        "Gateway activation failed, activateGateway returned false.",
      );
    });

    it('should not activate if already activated', async function () {

      await gatewayBaseInstance.activateGateway({ from: organizationOwner });
      await Utils.expectThrow(gatewayBaseInstance.activateGateway.call({ from: organizationOwner }));
    });

    it('should be activated by organization only', async function () {

      await Utils.expectThrow(gatewayBaseInstance.activateGateway.call({ from: accounts[0] }));
    });


  });

});
