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

const Utils = require('../../test_lib/utils.js');
const EventsDecoder = require('../../test_lib/event_decoder');

const Organization = artifacts.require('Organization');

contract('Organization.setAdmin()', async (accounts) => {

  let owner = accounts[0];
  let admin = accounts[1];
  let organization = null;

  beforeEach(async function () {
    organization = await Organization.new({ from: owner });
  });

  it('reverts when caller is not owner/admin', async () => {

    await Utils.expectRevert(
      organization.setAdmin(
        admin,
        { from: accounts[2] },
      ),
      'Only owner and admin are allowed to call this method.',
    );
  });

  it('reverts when admin is same as owner', async () => {

    await Utils.expectRevert(
      organization.setAdmin(
        owner,
        { from: owner },
      ),
      'Admin address can\'t be the same as the owner address.',
    );

  });

  it('should pass when valid admin is passed by owner', async () => {
    const admin = accounts[2];
    await organization.setAdmin(
      admin,
      { from: owner },
    );

    assert.strictEqual(
      await organization.admin.call(),
      admin,
      'The organization should now have the right admin set.',
    );
  });

  it('should pass when valid admin is passed by admin', async () => {
    await organization.setAdmin(
      admin,
      { from: owner },
    );
    let newAdmin = accounts[3];
    await organization.setAdmin(
      newAdmin,
      { from: admin },
    );

    assert.strictEqual(
      await organization.admin.call(),
      newAdmin,
      'The admin should now be the newly set admin.',
    );
  });

  it('should pass when admin address is 0x', async () => {
    await organization.setAdmin(
      '0x0000000000000000000000000000000000000000',
      { from: owner },
    );

    assert.strictEqual(
      await organization.admin.call(),
      '0x0000000000000000000000000000000000000000',
      'The admin address must be set to 0x correctly.'
    );
  });

  it('verifies emitting of AdminAddressChanged event', async () => {
    const transaction = await organization.setAdmin(
      admin,
      { from: owner },
    );

    const events = EventsDecoder.getEvents(
      transaction,
      organization,
    );

    assert.strictEqual(
      events.AdminAddressChanged.newAdmin,
      admin,
      'The event should emit the correct admin address.'
    );

  });

  it('Should not emit an event when the address did not change', async () => {
    await organization.setAdmin(admin, { from: owner });

    /*
     * The address was already set before. This should pass, but not emit an
     * event.
     */
    const transaction = await organization.setAdmin(
      admin,
      { from: owner },
    );

    const events = EventsDecoder.getEvents(
      transaction,
      organization,
    );

    assert.strictEqual(
      events.AdminAddressChanged,
      undefined,
      'The event should not be emitted when the address does not change.'
    );

  });

});
