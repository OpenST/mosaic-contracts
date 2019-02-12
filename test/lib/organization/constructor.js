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

const web3 = require('../../test_lib/web3');
const EventDecoder = require('../../test_lib/event_decoder');
const Utils = require('../../test_lib/utils');

const Organization = artifacts.require('Organization');

contract('Organization.constructor()', async (accounts) => {
  const zeroAddress = Utils.NULL_ADDRESS;

  const owner = accounts[3];
  const admin = accounts[4];
  const workers = [accounts[5], accounts[6], accounts[7], accounts[8]];
  let expirationHeight;

  beforeEach(async () => {
    const currentBlockHeight = await web3.eth.getBlockNumber();
    expirationHeight = currentBlockHeight + 10;
  });

  it('should construct with all parameters given', async () => {
    const organization = await Organization.new(
      owner,
      admin,
      workers,
      expirationHeight,
    );

    const setOwner = await organization.owner.call();
    assert.strictEqual(
      setOwner,
      owner,
      'The contract should set the given owner.',
    );

    const setAdmin = await organization.admin.call();
    assert.strictEqual(
      setAdmin,
      admin,
      'The contract should set the given admin.',
    );
  });

  it('should deploy with a zero admin', async () => {
    const organization = await Organization.new(
      owner,
      zeroAddress,
      workers,
      expirationHeight,
    );

    const setAdmin = await organization.admin.call();
    assert.strictEqual(
      setAdmin,
      zeroAddress,
      'The contract should set zero admin.',
    );
  });

  it('should deploy without any workers', async () => {
    await Organization.new(owner, admin, [], 0);
  });

  it('should register all given worker addresses with the given expiration height', async () => {
    const organization = await Organization.new(
      owner,
      admin,
      workers,
      expirationHeight,
    );

    const count = workers.length;
    for (let i = 0; i < count; i += 1) {
      const worker = workers[i];
      const setExpirationHeight = await organization.workers.call(worker);
      assert(
        setExpirationHeight.eqn(expirationHeight),
        `A given worker was not set with the right expiration height: ${worker}`,
      );
    }
  });

  it('should emit event that a worker was set', async () => {
    const worker = workers[0];
    const organization = await Organization.new(
      owner,
      admin,
      [worker],
      expirationHeight,
    );
    const receipt = await web3.eth.getTransactionReceipt(
      organization.transactionHash,
    );

    const event = EventDecoder.perform(
      receipt,
      organization.address,
      organization.abi,
    );

    assert.strictEqual(
      web3.utils.toChecksumAddress(event.WorkerSet.worker),
      worker,
      'The emitted event did not have the right worker set.',
    );

    assert.strictEqual(
      parseInt(event.WorkerSet.expirationHeight, 10),
      expirationHeight,
      'The emitted event did not have the right expiration height set.',
    );
  });

  it('should not deploy if the given owner is zero', async () => {
    await Utils.expectRevert(
      Organization.new(zeroAddress, admin, workers, expirationHeight),
      'The owner must not be the zero address\\.',
    );
  });

  it('should not deploy if any given worker address is zero', async () => {
    workers.push(zeroAddress);

    await Utils.expectRevert(
      Organization.new(owner, admin, workers, expirationHeight),
      'Worker address cannot be null\\.',
    );
  });

  it('should not deploy if the expiration height is not in the future for '
    + 'any workers',
  async () => {
    const currentBlockHeight = await web3.eth.getBlockNumber();
    const pastBlockHeight = currentBlockHeight - 1;

    await Utils.expectRevert(
      Organization.new(owner, admin, workers, pastBlockHeight),
      'Expiration height must be in the future\\.',
    );
  });
});
