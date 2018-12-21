// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const GatewayBase = artifacts.require('./GatewayBase.sol')
  , BN = require('bn.js');

const MockOrganization = artifacts.require('MockOrganization.sol');
const Utils = require('../../../test/test_lib/utils');

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
      _unlockHeight: new BN(expectedUnlockHeight),
    }
  };

  assert.equal(
    response.receipt.status,
    1,
    'Receipt status is unsuccessful',
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

      let dummyStateRootProviderAddress = accounts[0]
        , bounty = new BN(100);

      let organization = await MockOrganization.new(owner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProviderAddress,
        bounty,
        organization.address,
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

      let dummyStateRootProviderAddress = accounts[0]
        , bounty = new BN(100);

      let organization = await MockOrganization.new(owner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProviderAddress,
        bounty,
        organization.address,
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
        'Receipt status is unsuccessful',
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

