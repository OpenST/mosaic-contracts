const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const Utils = require('../../../test/lib/utils');


contract('GatewayBase.sol', function (accounts) {

  describe('Deactivate gateway', async () => {
    let gatewayBaseInstance;
    let organisation = accounts[2];

    beforeEach(async function () {

      let core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        organisation
      );

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

    beforeEach(async function () {
      let core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        organisation
      );

      await gatewayBaseInstance.deactivateGateway({from: organisation});
    });

    it('should activate if deActivated', async function () {

      assert((await gatewayBaseInstance.activateGateway.call({from: organisation})),
             "Gateway activation failed, activateGateway returned false."
            );
    });

    it('should not activate if already activated', async function () {

      await gatewayBaseInstance.activateGateway({from: organisation});
      await Utils.expectThrow(gatewayBaseInstance.activateGateway.call({from: organisation}));
    });

    it('should be activated by organization only', async function () {

      await Utils.expectThrow(gatewayBaseInstance.activateGateway.call({from: accounts[0]}));
    });


  });

});
