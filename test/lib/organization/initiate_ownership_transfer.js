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

const Utils = require('../../test_lib/utils.js');
const EventsDecoder = require('../../test_lib/event_decoder.js');

const Organization = artifacts.require('Organization');

contract('Organization.initiateOwnershipTransfer()', async (accounts) => {
  const owner = accounts[0];
  const proposedOwner = accounts[1];
  let organization = null;

  beforeEach(async () => {
    const admin = Utils.NULL_ADDRESS;
    const workers = [];
    const expirationHeight = 0;

    organization = await Organization.new(
      owner,
      admin,
      workers,
      expirationHeight,
    );
  });

  it('reverts when caller is not owner', async () => {
    await Utils.expectRevert(
      organization.initiateOwnershipTransfer(proposedOwner, {
        from: proposedOwner,
      }),
      'Only owner is allowed to call.',
    );
  });

  it('reverts when proposed owner is same as owner', async () => {
    await Utils.expectRevert(
      organization.initiateOwnershipTransfer(owner, { from: owner }),
      "Proposed owner address can't be current owner address.",
    );
  });

  it('should pass when valid proposed owner is passed', async () => {
    const response = await organization.initiateOwnershipTransfer.call(
      proposedOwner,
      { from: owner },
    );
    assert.strictEqual(
      response,
      true,
      'The ownership initiation should return true.',
    );

    await organization.initiateOwnershipTransfer(proposedOwner, {
      from: owner,
    });

    assert.strictEqual(
      await organization.proposedOwner.call(),
      proposedOwner,
      'Must accept a valid owner proposal.',
    );
  });

  it('should pass when proposed address is 0', async () => {
    await organization.initiateOwnershipTransfer(Utils.NULL_ADDRESS, {
      from: owner,
    });
    assert.strictEqual(
      await organization.proposedOwner.call(),
      Utils.NULL_ADDRESS,
      'Proposed 0-address must be accepted.',
    );
  });

  it('verifies emitting of OwnershipTransferInitiated event', async () => {
    const transaction = await organization.initiateOwnershipTransfer(
      proposedOwner,
      { from: owner },
    );
    const events = EventsDecoder.getEvents(transaction, organization);

    assert.strictEqual(
      events.OwnershipTransferInitiated.proposedOwner,
      proposedOwner,
      'The event does not emit the correct proposed owner.',
    );
    assert.strictEqual(
      events.OwnershipTransferInitiated.currentOwner,
      owner,
      'The event does not emit the correct current owner.',
    );
  });
});
