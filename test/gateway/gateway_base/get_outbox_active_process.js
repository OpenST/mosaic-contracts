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

const GatewayBase = artifacts.require('./TestGatewayBase.sol');
const BN = require('bn.js');
const web3 = require('../../test_lib/web3.js');
const messageBus = require('../../test_lib/message_bus.js');

const { MessageStatusEnum } = messageBus;
const Utils = require('../../../test/test_lib/utils');

const zeroBytes = Utils.ZERO_BYTES32;

contract('GatewayBase.getOutboxActiveProcess()', (accounts) => {
  let gatewayBase;
  let messageHash;
  let accountAddress;

  beforeEach(async () => {
    gatewayBase = await GatewayBase.new(accounts[0], new BN(100), accounts[1]);

    accountAddress = accounts[2];
    messageHash = web3.utils.sha3('message_hash');

    await gatewayBase.setOutboxProcess(accountAddress, messageHash);
  });

  it('should return correct message hash and message status', async () => {
    await gatewayBase.setOutboxStatus(messageHash, MessageStatusEnum.Declared);

    let result = await gatewayBase.getOutboxActiveProcess(accountAddress);

    assert.strictEqual(
      result.status_.eqn(MessageStatusEnum.Declared),
      true,
      `Message status ${result.status_.toString(10)} must be equal to ${
        MessageStatusEnum.Declared
      }`,
    );

    assert.strictEqual(
      result.messageHash_,
      messageHash,
      `Message hash ${result.messageHash_} must be equal to ${messageHash}`,
    );

    // Change the message status.

    await gatewayBase.setOutboxStatus(messageHash, MessageStatusEnum.Revoked);

    result = await gatewayBase.getOutboxActiveProcess(accountAddress);

    assert.strictEqual(
      result.status_.eqn(MessageStatusEnum.Revoked),
      true,
      `Message status ${result.status_.toString(10)} must be equal to ${
        MessageStatusEnum.Revoked
      }`,
    );

    assert.strictEqual(
      result.messageHash_,
      messageHash,
      `Message hash ${result.messageHash_} must be equal to ${messageHash}`,
    );
  });

  it(
    'should return zero message hash and undeclared message status when the '
      + 'account address does not have active outbox process',
    async () => {
      await gatewayBase.setOutboxStatus(
        messageHash,
        MessageStatusEnum.Declared,
      );

      accountAddress = accounts[5];

      const result = await gatewayBase.getOutboxActiveProcess(accountAddress);

      assert.strictEqual(
        result.status_.eqn(MessageStatusEnum.Undeclared),
        true,
        `Message status ${result.status_.toString(10)} must be equal to ${
          MessageStatusEnum.Undeclared
        }`,
      );

      assert.strictEqual(
        result.messageHash_,
        zeroBytes,
        `Message hash ${result.messageHash_} must be equal to ${zeroBytes}`,
      );
    },
  );

  it('should return the most recent active process', async () => {
    await gatewayBase.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Progressed,
    );

    let result = await gatewayBase.getOutboxActiveProcess(accountAddress);

    assert.strictEqual(
      result.status_.eqn(MessageStatusEnum.Progressed),
      true,
      `Message status ${result.status_.toString(10)} must be equal to ${
        MessageStatusEnum.Progressed
      }`,
    );

    assert.strictEqual(
      result.messageHash_,
      messageHash,
      `Message hash ${result.messageHash_} must be equal to ${messageHash}`,
    );

    // Get the new message hash.
    messageHash = web3.utils.sha3('message_hash_1');

    // Set the new message hash as active inbox process.
    await gatewayBase.setOutboxProcess(accountAddress, messageHash);

    await gatewayBase.setOutboxStatus(messageHash, MessageStatusEnum.Declared);

    result = await gatewayBase.getOutboxActiveProcess(accountAddress);

    assert.strictEqual(
      result.status_.eqn(MessageStatusEnum.Declared),
      true,
      `Message status ${result.status_.toString(10)} must be equal to ${
        MessageStatusEnum.Declared
      }`,
    );

    assert.strictEqual(
      result.messageHash_,
      messageHash,
      `Message hash ${result.messageHash_} must be equal to ${messageHash}`,
    );
  });
});
