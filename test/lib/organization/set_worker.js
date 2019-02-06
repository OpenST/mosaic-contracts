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

contract('Organization.setWorker()', async (accounts) => {
  const owner = accounts[0];
  const admin = accounts[1];
  const worker = accounts[2];
  const expirationHeightDelta = 10;

  let organization = null;
  let expirationHeight = 0;

  beforeEach(async () => {
    const workers = [];

    organization = await Organization.new(
      owner,
      admin,
      workers,
      expirationHeight,
    );

    const currentBlockNumber = await web3.eth.getBlockNumber();
    expirationHeight = currentBlockNumber + expirationHeightDelta;
  });

  it('reverts when caller is not owner/admin', async () => {
    await Utils.expectRevert(
      organization.setWorker(worker, expirationHeight, { from: accounts[3] }),
      'Only owner and admin are allowed to call this method.',
    );
  });

  it('reverts when worker address is null', async () => {
    await Utils.expectRevert(
      organization.setWorker(Utils.NULL_ADDRESS, expirationHeight, {
        from: owner,
      }),
      'Worker address cannot be null.',
    );
  });

  it('reverts when expiration height is expired', async () => {
    const blockNumber = await web3.eth.getBlockNumber();
    expirationHeight = blockNumber + expirationHeightDelta;
    for (let i = 0; i < expirationHeightDelta; i++) {
      await Utils.advanceBlock();
    }

    // Checking that worker key has expired.
    assert.strictEqual(
      await organization.isWorker.call(worker),
      false,
      'The worker was expected to be expired.',
    );
    await Utils.expectRevert(
      organization.setWorker(worker, expirationHeight, { from: owner }),
      'Expiration height must be in the future.',
    );
  });

  it('should pass when owner adds a worker with valid expiration height', async () => {
    await organization.setWorker(worker, expirationHeight, { from: owner });
    assert(
      (await organization.workers.call(worker)).eqn(expirationHeight),
      'The recorded expiration height should equal the given one.',
    );
  });

  it('should pass when admin adds a worker with valid expiration height', async () => {
    await organization.setWorker(worker, expirationHeight, { from: admin });
    assert(
      (await organization.workers.call(worker)).eqn(expirationHeight),
      'The recorded expiration height should equal the given one.',
    );
  });

  it('verifies emitting of WorkerSet event', async () => {
    const transaction = await organization.setWorker(
      worker,
      expirationHeight,
      { from: owner },
    );

    const events = EventsDecoder.getEvents(transaction, organization);

    assert.strictEqual(
      events.WorkerSet.worker,
      worker,
      'Event must emit correct worker.',
    );
    assert(
      events.WorkerSet.expirationHeight.eqn(expirationHeight),
      'Event must emit correct expiration height.',
    );
  });
});
