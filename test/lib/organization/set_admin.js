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
const EventsDecoder = require('../../test_lib/event_decoder');

const Organization = artifacts.require('Organization');

contract('Organization.setAdmin()', async (accounts) => {
  const owner = accounts[0];
  const admin = accounts[1];
  let organization = null;

  beforeEach(async () => {
    const zeroAdmin = Utils.NULL_ADDRESS;
    const workers = [];
    const expirationHeight = 0;

    organization = await Organization.new(
      owner,
      zeroAdmin,
      workers,
      expirationHeight,
    );
  });

  it('reverts when caller is not owner/admin', async () => {
    await Utils.expectRevert(
      organization.setAdmin(admin, { from: accounts[2] }),
      'Only owner and admin are allowed to call this method.',
    );
  });

  it('should pass when valid admin is passed by owner', async () => {
    const admin = accounts[2];
    await organization.setAdmin(admin, { from: owner });

    assert.strictEqual(
      await organization.admin.call(),
      admin,
      'The organization should now have the right admin set.',
    );
  });

  it('should pass when valid admin is passed by admin', async () => {
    await organization.setAdmin(admin, { from: owner });
    const newAdmin = accounts[3];
    await organization.setAdmin(newAdmin, { from: admin });

    assert.strictEqual(
      await organization.admin.call(),
      newAdmin,
      'The admin should now be the newly set admin.',
    );
  });

  it('should pass when admin address is 0x', async () => {
    await organization.setAdmin(Utils.NULL_ADDRESS, { from: owner });

    assert.strictEqual(
      await organization.admin.call(),
      Utils.NULL_ADDRESS,
      'The admin address must be set to 0x correctly.',
    );
  });

  it('verifies emitting of AdminAddressChanged event', async () => {
    const previousAdmin = await organization.admin.call();
    const transaction = await organization.setAdmin(admin, { from: owner });

    const events = EventsDecoder.getEvents(transaction, organization);

    assert.strictEqual(
      events.AdminAddressChanged.newAdmin,
      admin,
      'The event should emit the correct admin address.',
    );
    assert.strictEqual(
      events.AdminAddressChanged.previousAdmin,
      previousAdmin,
      'The event should emit the correct address of the previous admin.',
    );
  });

  it('Should not emit an event when the address did not change', async () => {
    await organization.setAdmin(admin, { from: owner });

    /*
     * The address was already set before. This should pass, but not emit an
     * event.
     */
    const transaction = await organization.setAdmin(admin, { from: owner });

    const events = EventsDecoder.getEvents(transaction, organization);

    assert.strictEqual(
      events.AdminAddressChanged,
      undefined,
      'The event should not be emitted when the address does not change.',
    );
  });
});
