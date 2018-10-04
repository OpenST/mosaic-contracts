const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const Utils = require('../../../test/lib/utils');

contract('GatewayBase.sol', function (accounts) {

  describe('Initiate change bounty', async () => {

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

    it('should be able to propose bounty change', async function () {

      let proposedBounty = new BN(50);
      let actualProposedBounty = await gatewayBaseInstance.initiateBountyAmountChange.call(proposedBounty, {from: organisation});

      assert(proposedBounty.eq(actualProposedBounty));

      let receipt = await gatewayBaseInstance.initiateBountyAmountChange(proposedBounty, {from: organisation});
    });

    it('only organization should be able to propose bounty change', async function () {

      let proposedBounty = new BN(50);
      Utils.expectThrow(gatewayBaseInstance.initiateBountyAmountChange.call(proposedBounty, {from: accounts[1]}));
    });


  });
});