const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const MockWorkerManager = artifacts.require('MockWorkerManager.sol');
const Utils = require('../../../test/test_lib/utils');


contract('GatewayBase.sol', function (accounts) {

  describe('Deactivate gateway', async () => {
    let gatewayBaseInstance;
    let worker = accounts[2];

    beforeEach(async function () {

      let core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);

      let workerManager = await MockWorkerManager.new(worker);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        workerManager.address
      );

    });

    it('should deactivate if activated', async function () {

      assert((await gatewayBaseInstance.deactivateGateway.call({ from: worker })));
    });

    it('should not deactivate if already deactivated', async function () {

      await gatewayBaseInstance.deactivateGateway({ from: worker });
      await Utils.expectThrow(gatewayBaseInstance.deactivateGateway.call({ from: worker }));
    });

    it('should deactivated by organization only', async function () {

      await Utils.expectThrow(gatewayBaseInstance.deactivateGateway.call({ from: accounts[0] }));
    });

  });

  describe('Activate  Gateway', async () => {
    let gatewayBaseInstance;
    let worker = accounts[2];

    beforeEach(async function () {
      let core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);

      let workerManager = await MockWorkerManager.new(worker);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        workerManager.address
      );

      await gatewayBaseInstance.deactivateGateway({ from: worker });
    });

    it('should activate if deActivated', async function () {

      assert(
        (await gatewayBaseInstance.activateGateway.call({ from: worker })),
        "Gateway activation failed, activateGateway returned false.",
      );
    });

    it('should not activate if already activated', async function () {

      await gatewayBaseInstance.activateGateway({ from: worker });
      await Utils.expectThrow(gatewayBaseInstance.activateGateway.call({ from: worker }));
    });

    it('should be activated by organization only', async function () {

      await Utils.expectThrow(gatewayBaseInstance.activateGateway.call({ from: accounts[0] }));
    });


  });

});
