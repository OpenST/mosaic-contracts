// Copyright 2019 OpenST Ltd.
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

const GatewayBase = artifacts.require('./GatewayBase.sol');

const BN = require('bn.js');

const MockOrganization = artifacts.require('MockOrganization.sol');
const Utils = require('../../../test/test_lib/utils');

const unlockTimeInBlocks = 100;

async function proposeBountyChange(
  gatewayBaseInstance,
  proposedBounty,
  organization,
  currentBounty,
) {
  const actualProposedBounty = await gatewayBaseInstance.initiateBountyAmountChange.call(
    proposedBounty,
    { from: organization },
  );

  assert(proposedBounty.eq(actualProposedBounty));

  const response = await gatewayBaseInstance.initiateBountyAmountChange(
    proposedBounty,
    { from: organization },
  );

  const expectedUnlockHeight = response.receipt.blockNumber + unlockTimeInBlocks;

  const expectedEvent = {
    BountyChangeInitiated: {
      _currentBounty: currentBounty,
      _proposedBounty: proposedBounty,
      _unlockHeight: new BN(expectedUnlockHeight),
    },
  };

  assert.equal(response.receipt.status, 1, 'Receipt status is unsuccessful');

  const eventData = response.logs;
  await Utils.validateEvents(eventData, expectedEvent);
  return expectedUnlockHeight;
}

contract('GatewayBase.sol', (accounts) => {
  describe('Initiate change bounty', async () => {
    let gatewayBaseInstance;
    const owner = accounts[2];
    const worker = accounts[3];

    beforeEach(async () => {
      const dummyStateRootProviderAddress = accounts[0];

      const bounty = new BN(100);

      const organization = await MockOrganization.new(owner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProviderAddress,
        bounty,
        organization.address,
      );
    });

    it('should be able to propose bounty change', async () => {
      const proposedBounty = new BN(50);
      const currentBounty = new BN(100);

      await proposeBountyChange(
        gatewayBaseInstance,
        proposedBounty,
        owner,
        currentBounty,
      );
    });

    it('should be able to re-propose bounty change', async () => {
      let proposedBounty = new BN(50);
      let currentBounty = new BN(100);

      await proposeBountyChange(
        gatewayBaseInstance,
        proposedBounty,
        owner,
        currentBounty,
      );

      proposedBounty = new BN(150);
      currentBounty = new BN(100);

      await proposeBountyChange(
        gatewayBaseInstance,
        proposedBounty,
        owner,
        currentBounty,
      );
    });

    it('should accept propose bounty change from organization only', async () => {
      const proposedBounty = new BN(50);
      await Utils.expectThrow(
        gatewayBaseInstance.initiateBountyAmountChange.call(proposedBounty, {
          from: accounts[1],
        }),
      );
    });
  });

  describe('Confirm Bounty change', async () => {
    let gatewayBaseInstance;
    const owner = accounts[2];
    const worker = accounts[3];
    let unlockHeight;
    let currentBlock;
    const proposedBounty = new BN(50);
    const currentBounty = new BN(100);

    beforeEach(async () => {
      const dummyStateRootProviderAddress = accounts[0];

      const bounty = new BN(100);

      const organization = await MockOrganization.new(owner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProviderAddress,
        bounty,
        organization.address,
      );
      unlockHeight = await proposeBountyChange(
        gatewayBaseInstance,
        proposedBounty,
        owner,
        currentBounty,
      );
      currentBlock = unlockHeight - unlockTimeInBlocks;
    });

    it('should be able to confirm bounty change after unlockHeight', async () => {
      while (currentBlock < unlockHeight) {
        await Utils.expectThrow(
          gatewayBaseInstance.confirmBountyAmountChange({ from: owner }),
        );
        currentBlock++;
      }
      const response = await gatewayBaseInstance.confirmBountyAmountChange({
        from: owner,
      });

      const expectedEvent = {
        BountyChangeConfirmed: {
          _currentBounty: currentBounty,
          _changedBounty: proposedBounty,
        },
      };

      assert.equal(
        response.receipt.status,
        1,
        'Receipt status is unsuccessful',
      );

      const eventData = response.logs;
      await Utils.validateEvents(eventData, expectedEvent);
    });

    it('should not be able to confirm bounty change before unlockHeight', async () => {
      while (currentBlock < unlockHeight) {
        await Utils.expectThrow(
          gatewayBaseInstance.confirmBountyAmountChange({ from: owner }),
        );
        currentBlock++;
      }
    });

    it('should not accept a bounty change from another address than the organization', async () => {
      while (currentBlock < unlockHeight) {
        await Utils.expectThrow(
          gatewayBaseInstance.confirmBountyAmountChange({ from: owner }),
        );
        currentBlock++;
      }
      await Utils.expectThrow(
        gatewayBaseInstance.confirmBountyAmountChange({ from: accounts[5] }),
      );
    });
  });
});
