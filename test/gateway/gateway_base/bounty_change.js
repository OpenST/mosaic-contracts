const GatewayBase = artifacts.require("./GatewayBase.sol")
  , BN = require('bn.js');

const MockMembersManager = artifacts.require('MockMembersManager.sol');
const Utils = require('../../../test/test_lib/utils');

const NullAddress = "0x0000000000000000000000000000000000000000";
let unlockTimeInBlocks = 100;

async function proposeBountyChange(gatewayBaseInstance, proposedBounty, organization, currentBounty) {

  let actualProposedBounty = await gatewayBaseInstance.initiateBountyAmountChange.call(proposedBounty, { from: organization });

  assert(proposedBounty.eq(actualProposedBounty));

  let response = await gatewayBaseInstance.initiateBountyAmountChange(proposedBounty, { from: organization });

  let expectedUnlockHeight = response.receipt.blockNumber + unlockTimeInBlocks;

  let expectedEvent = {
    BountyChangeInitiated: {
      _currentBounty: currentBounty,
      _proposedBounty: proposedBounty,
      _unlockHeight: new BN(expectedUnlockHeight)
    }
  };

  assert.equal(
    response.receipt.status,
    1,
    "Receipt status is unsuccessful"
  );

  let eventData = response.logs;
  await Utils.validateEvents(eventData, expectedEvent);
  return expectedUnlockHeight;
}

contract('GatewayBase.sol', function (accounts) {

  describe('Initiate change bounty', async () => {

    let gatewayBaseInstance;
    let owner = accounts[2];
    let worker = accounts[3];

    beforeEach(async function () {

      let core = accounts[0]
        , bounty = new BN(100);

      let membersManager = await MockMembersManager.new(owner, worker);
      let burner = NullAddress;

      gatewayBaseInstance = await GatewayBase.new(
        core,
        bounty,
        membersManager.address,
        burner
      );

    });

    it('should be able to propose bounty change', async function () {

      let proposedBounty = new BN(50);
      let currentBounty = new BN(100);

      await proposeBountyChange(gatewayBaseInstance, proposedBounty, owner, currentBounty);

    });

    it('should be able to re-propose bounty change', async function () {

      let proposedBounty = new BN(50);
      let currentBounty = new BN(100);

      await proposeBountyChange(gatewayBaseInstance, proposedBounty, owner, currentBounty);

      proposedBounty = new BN(150);
      currentBounty = new BN(100);

      await proposeBountyChange(gatewayBaseInstance, proposedBounty, owner, currentBounty);
    });

    it('should accept propose bounty change from organization only', async function () {

      let proposedBounty = new BN(50);
      await Utils.expectThrow(
        gatewayBaseInstance.initiateBountyAmountChange.call(
          proposedBounty, { from: accounts[1] }
        )
      );
    });
  });

  describe('Confirm Bounty change', async () => {

    let gatewayBaseInstance;
    let owner = accounts[2];
    let worker = accounts[3];
    let unlockHeight;
    let currentBlock;
    let proposedBounty = new BN(50);
    let currentBounty = new BN(100);

    beforeEach(async function () {

      let core = accounts[0]
        , bounty = new BN(100);

      let membersManager = await MockMembersManager.new(owner, worker);
      let burner = NullAddress;

      gatewayBaseInstance = await GatewayBase.new(
        core,
        bounty,
        membersManager.address,
        burner
      );
      unlockHeight = await proposeBountyChange(gatewayBaseInstance, proposedBounty, owner, currentBounty);
      currentBlock = unlockHeight - unlockTimeInBlocks;
    });

    it('should be able to confirm bounty change after unlockHeight', async function () {

      while (currentBlock < unlockHeight) {
        await Utils.expectThrow(gatewayBaseInstance.confirmBountyAmountChange({ from: owner }));
        currentBlock++;
      }
      let response = await gatewayBaseInstance.confirmBountyAmountChange({ from: owner })

      let expectedEvent = {
        BountyChangeConfirmed: {
          _currentBounty: currentBounty,
          _changedBounty: proposedBounty,
        }
      };

      assert.equal(
        response.receipt.status,
        1,
        "Receipt status is unsuccessful"
      );

      let eventData = response.logs;
      await Utils.validateEvents(eventData, expectedEvent);
    });

    it('should not be able to confirm bounty change before unlockHeight', async function () {

      while (currentBlock < unlockHeight) {
        await Utils.expectThrow(gatewayBaseInstance.confirmBountyAmountChange({ from: owner }));
        currentBlock++;
      }
    });

    it('should not accept a bounty change from another address than the organization', async function () {

      while (currentBlock < unlockHeight) {
        await Utils.expectThrow(gatewayBaseInstance.confirmBountyAmountChange({ from: owner }));
        currentBlock++;
      }
      await Utils.expectThrow(gatewayBaseInstance.confirmBountyAmountChange({ from: accounts[5] }));
    });


  });
});
