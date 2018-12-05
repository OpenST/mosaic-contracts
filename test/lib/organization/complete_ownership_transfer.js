// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const Utils = require('../../test_lib/utils.js');
const EventsDecoder = require('../../test_lib/event_decoder.js');

const Organization = artifacts.require('Organization');

contract('Organization.completeOwnershipTransfer()', async (accounts) => {

  let owner = accounts[0];
  let proposedOwner = accounts[1];
  let organization = null;

  beforeEach(async function () {
    organization = await Organization.new({ from: owner });
    await organization.initiateOwnershipTransfer(
      proposedOwner,
      { from: owner },
    )
  });

  it('reverts when caller is not proposed owner', async () => {
    await Utils.expectRevert(
      organization.completeOwnershipTransfer({ from: owner }),
      'Caller is not proposed owner address.',
    );
  });

  it('should pass when caller is proposed owner', async () => {
    let response = await organization.completeOwnershipTransfer.call(
      { from: proposedOwner }
    );
    assert.strictEqual(response, true);

    await organization.completeOwnershipTransfer({ from: proposedOwner });

    assert.strictEqual(
      await organization.owner.call(),
      proposedOwner,
      'The owner must now be the proposed owner.',
    );
    assert.strictEqual(
      await organization.proposedOwner.call(),
      '0x0000000000000000000000000000000000000000',
      'The proposed owner must be 0 after it became the owner.',
    );
  });

  it('verifies emitting of OwnershipTransferCompleted event', async () => {
    const transaction = await organization.completeOwnershipTransfer(
      { from: proposedOwner },
    );

    const events = EventsDecoder.getEvents(
      transaction,
      organization,
    );

    assert.strictEqual(
      events.OwnershipTransferCompleted.newOwner,
      proposedOwner,
      'The emitted event does not record the new owner.',
    );

  });

});
