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
const BN = require("bn.js");
const web3 = require('../../test_lib/web3.js');
const messageBus = require('../../test_lib/message_bus.js');
const MessageStatusEnum = messageBus.MessageStatusEnum;
const Utils = require('../../../test/test_lib/utils');
const zeroBytes = Utils.ZERO_BYTES32;

contract('GatewayBase.getInboxActiveProcess()', function (accounts) {

  let gatewayBase, messageHash, accountAddress;

  beforeEach(async function () {

    gatewayBase = await GatewayBase.new(
      accounts[0],
      new BN(100),
      accounts[1],
    );

    accountAddress = accounts[2];
    messageHash = web3.utils.sha3("message_hash");

    await gatewayBase.setInboxProcess(
      accountAddress,
      new BN(1),
      messageHash
    );

  });

  it('should return correct message hash and message status', async function () {

    await gatewayBase.setInboxStatus(messageHash, MessageStatusEnum.Declared);

    let result = await gatewayBase.getInboxActiveProcess(accountAddress);

    assert.strictEqual(
      result.status_.eqn(MessageStatusEnum.Declared),
      true,
      `Message status ${result.status_.toString(10)} must be equal to ${MessageStatusEnum.Declared}`,
    );

    assert.strictEqual(
      result.messageHash_,
      messageHash,
      `Message hash ${result.messageHash_} must be equal to ${messageHash}`,
    );

    // Change the message status.

    await gatewayBase.setInboxStatus(messageHash, MessageStatusEnum.Revoked);

    result = await gatewayBase.getInboxActiveProcess(accountAddress);

    assert.strictEqual(
      result.status_.eqn(MessageStatusEnum.Revoked),
      true,
      `Message status ${result.status_.toString(10)} must be equal to ${MessageStatusEnum.Revoked}`,
    );

    assert.strictEqual(
      result.messageHash_,
      messageHash,
      `Message hash ${result.messageHash_} must be equal to ${messageHash}`,
    );

  });

  it('should return zero message hash and undeclared message status when the ' +
    'account address does not have active inbox process', async function () {

    await gatewayBase.setInboxStatus(messageHash, MessageStatusEnum.Declared);

    accountAddress = accounts[5];

    let result = await gatewayBase.getInboxActiveProcess(accountAddress);

    assert.strictEqual(
      result.status_.eqn(MessageStatusEnum.Undeclared),
      true,
      `Message status ${result.status_.toString(10)} must be equal to ${MessageStatusEnum.Undeclared}`,
    );

    assert.strictEqual(
      result.messageHash_,
      zeroBytes,
      `Message hash ${result.messageHash_} must be equal to ${zeroBytes}`,
    );

  });

});
