const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";
contract('GatewayBase.sol', function (accounts) {

  describe('Construction', async () => {

    let core, bounty, organisation;

    beforeEach(function () {

      organisation = accounts[2]
        , core = accounts[0]
        , bounty = new BN(100);
    });

    it('should pass with right set of parameters', async function () {

      let gatewayBaseInstance = await GatewayBase.new(
        core,
        bounty,
        organisation
      );

      assert.equal(core,await gatewayBaseInstance.core.call());
      assert.equal(organisation, await gatewayBaseInstance.organisation.call());
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should pass with right set of parameters and zero bounty', async function () {

      bounty = new BN(0);

      let gatewayBaseInstance = await GatewayBase.new(
        core,
        bounty,
        organisation
      );

      assert.equal(core, await gatewayBaseInstance.core.call());
      assert.equal(organisation, await gatewayBaseInstance.organisation.call());
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should fail if core address is not passed', async function () {

      core = NullAddress;
     await Utils.expectRevert(
         GatewayBase.new(core, bounty, organisation),
         "Core contract address must not be zero."
     );

    });

    it('should fail if organisation address is not passed', async function () {

      organisation = NullAddress;
      await Utils.expectRevert(
          GatewayBase.new(core,  bounty, organisation),
          "Organisation address must not be zero."
      );

    });
  });
});
