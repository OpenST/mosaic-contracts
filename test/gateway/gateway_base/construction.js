const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const MockMembersManager = artifacts.require('MockMembersManager.sol');
const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('GatewayBase.sol', function (accounts) {

  describe('Construction', async () => {

    let dummyStateRootProvider, bounty, worker, membersManager;

    beforeEach(async function () {

      owner = accounts[2]
        , worker = accounts[3]
        , dummyStateRootProvider = accounts[0]
        , bounty = new BN(100);

      membersManager = await MockMembersManager.new(owner, worker);
    });

    it('should pass with right set of parameters', async function () {
      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProvider,
        bounty,
        membersManager.address
      );

      assert.strictEqual(
        dummyStateRootProvider,
        await gatewayBaseInstance.stateRootProvider.call(),
        "State root provider contract address doesn't match."
      );
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should pass with right set of parameters and zero bounty', async function () {

      bounty = new BN(0);

      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProvider,
        bounty,
        membersManager.address
      );

      assert.equal(dummyStateRootProvider, await gatewayBaseInstance.stateRootProvider.call());
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should fail if state root provider contract address is zero', async function () {

      let stateRootProvider = NullAddress;
      await Utils.expectRevert(
        GatewayBase.new(stateRootProvider, bounty, membersManager.address),
        "State root provider contract address must not be zero."
      );

    });

    it('should fail if worker manager address is not passed', async function () {

      await Utils.expectRevert(
        GatewayBase.new(dummyStateRootProvider, bounty, NullAddress),
        "MembersManager contract address must not be zero."
      );

    });
  });
});
