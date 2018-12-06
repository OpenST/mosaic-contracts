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

const web3 = require('../../test_lib/web3.js');

const Utils = require('../../test_lib/utils.js');
const EventsDecoder = require('../../test_lib/event_decoder.js');

const Organization = artifacts.require('Organization');

contract('Organization.unsetWorker()', async (accounts) => {

  let owner = accounts[0];
  let worker = accounts[1];
  let admin = accounts[2];

  let organization = null;

  beforeEach(async function () {
    organization = await Organization.new({ from: owner });
    expirationHeight = (await web3.eth.getBlockNumber()) + 10;
    await organization.setWorker(worker, expirationHeight, { from: owner });
  });

  it('reverts when caller is not owner/admin', async () => {

    await Utils.expectRevert(
      organization.unsetWorker(
        worker,
        { from: accounts[4] },
      ),
      'Only owner and admin are allowed to call this method.',
    );

  });

  it('should pass when owner unsets/deactivates a worker', async () => {
    await organization.unsetWorker(
      worker,
      { from: owner },
    );

    let returnedWorker = await organization.workers.call(worker);
    assert(
      returnedWorker.eqn(0),
      'Worker should be reset to zero.',
    );

  });

  it('should pass when admin unsets/deactivates a worker', async () => {
    await organization.setAdmin(admin, { from: owner });
    await organization.unsetWorker(
      worker,
      { from: admin },
    );

    let returnedWorker = await organization.workers.call(worker);
    assert(
      returnedWorker.eqn(0),
      'Worker should be reset to zero.',
    );

  });

  it('emits an unsetWorker event when worker is present', async () => {
    await organization.setWorker(worker, expirationHeight, { from: owner });
    const transaction = await organization.unsetWorker(
      worker,
      { from: owner },
    );
    const events = EventsDecoder.getEvents(
      transaction,
      organization,
    );

    assert.strictEqual(
      events.WorkerUnset.worker,
      worker,
      'The event should list the worker that was unset.',
    );
    assert.strictEqual(
      events.WorkerUnset.wasSet,
      true,
      'The event should list the worker as previously set.',
    );

  });

  it('emits an unsetWorker event when worker is not present', async () => {
    let nonSetWorker = accounts[4];
    const transaction = await organization.unsetWorker(
      nonSetWorker,
      { from: owner },
    );
    const events = EventsDecoder.getEvents(
      transaction,
      organization,
    );

    assert.strictEqual(
      events.WorkerUnset.worker,
      nonSetWorker,
      'The event should list the worker that was unset.',
    );
    assert.strictEqual(
      events.WorkerUnset.wasSet,
      false,
      'The event should not list the worker as previously set.',
    );

  });

});
