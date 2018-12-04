const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const MockWorkerManager = artifacts.require('MockWorkerManager.sol');
const Utils = require('../../../test/test_lib/utils');

contract('GatewayBase.sol', function (accounts) {

  describe('Construction', async () => {

    let core, messageBus, bounty, worker;

    before(function () {

      worker = accounts[2]
        , core = accounts[0]
        , messageBus = accounts[1]
        , bounty = new BN(100);
    });

    it('should pass with right set of parameters', async function () {

      let workerManager = await MockWorkerManager.new(worker);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        workerManager.address
      );

      assert.equal(core, await gatewayBaseInstance.core.call());
      assert.equal(messageBus, await gatewayBaseInstance.messageBus.call());
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
      assert(!(await gatewayBaseInstance.linked.call()));
      assert(!(await gatewayBaseInstance.deactivated.call()));
    });

    it('should pass with right set of parameters and zero bounty', async function () {

      bounty = new BN(0);

      let workerManager = await MockWorkerManager.new(worker);

      gatewayBaseInstance = await GatewayBase.new(
        core,
        messageBus,
        bounty,
        workerManager.address
      );

      assert.equal(core, await gatewayBaseInstance.core.call());
      assert.equal(messageBus, await gatewayBaseInstance.messageBus.call());
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
      assert(!(await gatewayBaseInstance.linked.call()));
      assert(!(await gatewayBaseInstance.deactivated.call()));
    });

    it('should fail if core address is not passed', async function () {

      core = '0x0000000000000000000000000000000000000000';
      await Utils.expectThrow(GatewayBase.new(core, messageBus, bounty, worker));

    });

    it('should fail if message address is not passed', async function () {

      messageBus = '0x0000000000000000000000000000000000000000';
      await Utils.expectThrow(GatewayBase.new(core, messageBus, bounty, worker));

    });

    it('should fail if worker manager address is not passed', async function () {

      worker = '0x0000000000000000000000000000000000000000';
      await Utils.expectThrow(GatewayBase.new(core, messageBus, bounty, worker));

    });
  });
});
