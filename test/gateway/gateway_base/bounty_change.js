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

      let expectedEvent = {
        BountyChangeInitiated: {
          _currentBounty: 100,
          _proposedBounty: 50,
        }
      };

      let actualProposedBounty = await gatewayBaseInstance.initiateBountyAmountChange.call(proposedBounty, {from: organisation});

      assert(proposedBounty.eq(actualProposedBounty));

      let response = await gatewayBaseInstance.initiateBountyAmountChange(proposedBounty, {from: organisation});

      assert.equal(
        response.receipt.status,
        1,
        "Receipt status is unsuccessful"
      );
      let eventData = response.logs;
      Utils.validateEvents(eventData, expectedEvent);
    });

    it('only organization should be able to propose bounty change', async function () {

      let proposedBounty = new BN(50);
      await  Utils.expectThrow(gatewayBaseInstance.initiateBountyAmountChange.call(proposedBounty, {from: accounts[1]}));
    });


  });
});