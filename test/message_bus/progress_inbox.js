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
// Test: progress_inbox.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const utils = require('../lib/utils.js'),
  messageBus = artifacts.require('./MessageBus.sol'),
  messageBusTest = artifacts.require('../contracts/test/MessageBusTest.sol'),
  hasher = artifacts.require('../contracts/gateway/Hasher.sol'),
  hashLock = require('../lib/hash_lock.js');

module.exports.perform = (accounts) => {
  let hasher = null,
    intentHash = "0x" + keccak256('intent'),
    nonce = 1,
    gasPrice = 0x12A05F200,
    sender = accounts[0],
    hashLockObject1 = hashLock.getHashLock(),
    hashLockObject2 = hashLock.getHashLock(),
    gasConsumed = 0x12A05F200,
    signature = "signature",
    messageTypeHash = null,
    messageStatus = {
      Undeclared: 0,
      Declared: 1,
      Progressed: 2,
      Completed: 3,
      DeclaredRevocation: 4,
      Revoked: 5
    };

  before(async () => {
    deployer.deploy(messageBus);
    deployer.link(messageBus, messageBusTest);
    deployer.deploy(messageBusTest);
    hasher = await Hasher.new();
    messageTypeHash = hasher.STAKE_TYPEHASH;
  });

  it('Fails when unlockSecret is empty', async () => {
      utils.expectThrow(await messageBusTest.progressInbox(intentHash,
      nonce,
      gasPrice,
      sender,
      hashLockObject1.l,
      gasConsumed,
      signature,
      messageTypeHash,
      null));
  });

  it('Fails when unlockSecret is different for hashLock', async () => {
    utils.expectThrow(await messageBusTest.progressInbox(intentHash,
      nonce,
      gasPrice,
      sender,
      hashLockObject1.l,
      gasConsumed,
      signature,
      messageTypeHash,
      hashLockObject2.s));
  });

  it('Successfully does progress inbox', async () => {
    let status = await messageBusTest.progressInbox(intentHash,
      nonce,
      gasPrice,
      sender,
      hashLockObject1.l,
      gasConsumed,
      signature,
      messageTypeHash,
      hashLockObject1.s);
    assert.equal(status, messageStatus.Progressed);
  });

};
