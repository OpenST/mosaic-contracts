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

const web3 = require('../../test_lib/web3.js');

const Utils = require('../../test_lib/utils.js');
const EventsDecoder = require('../../test_lib/event_decoder.js');

const Organization = artifacts.require('Organization');

contract('Organization.unsetWorker()', async (accounts) => {
  const owner = accounts[0];
  const worker = accounts[1];
  const admin = accounts[2];

  let organization = null;
  let expirationHeight;

  beforeEach(async () => {
    expirationHeight = (await web3.eth.getBlockNumber()) + 10;

    const zeroAdmin = Utils.NULL_ADDRESS;
    const workers = [];
    organization = await Organization.new(
      owner,
      zeroAdmin,
      workers,
      expirationHeight,
    );
    await organization.setWorker(worker, expirationHeight, { from: owner });
  });

  it('reverts when caller is not owner/admin', async () => {
    await Utils.expectRevert(
      organization.unsetWorker(worker, { from: accounts[4] }),
      'Only owner and admin are allowed to call this method.',
    );
  });

  it('should pass when owner unsets/deactivates a worker', async () => {
    await organization.unsetWorker(worker, { from: owner });

    const returnedWorker = await organization.workers.call(worker);
    assert(returnedWorker.eqn(0), 'Worker should be reset to zero.');
  });

  it('should pass when admin unsets/deactivates a worker', async () => {
    await organization.setAdmin(admin, { from: owner });
    await organization.unsetWorker(worker, { from: admin });

    const returnedWorker = await organization.workers.call(worker);
    assert(returnedWorker.eqn(0), 'Worker should be reset to zero.');
  });

  it('emits an unsetWorker event when worker is present', async () => {
    await organization.setWorker(worker, expirationHeight, { from: owner });
    const transaction = await organization.unsetWorker(worker, {
      from: owner,
    });
    const events = EventsDecoder.getEvents(transaction, organization);

    assert.strictEqual(
      events.WorkerUnset.worker,
      worker,
      'The event should list the worker that was unset.',
    );
  });
});
