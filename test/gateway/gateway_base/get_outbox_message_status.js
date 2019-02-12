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

contract('GatewayBase.getOutboxMessageStatus()', (accounts) => {
  let gatewayBase;
  let messageHash;

  beforeEach(async () => {
    gatewayBase = await GatewayBase.new(accounts[0], new BN(100), accounts[1]);

    messageHash = web3.utils.sha3('message_hash');
  });

  it('should return correct message status', async () => {
    let status = await gatewayBase.getOutboxMessageStatus(messageHash);

    assert.strictEqual(
      status.eqn(MessageStatusEnum.Undeclared),
      true,
      `Message status ${status.toString(10)} must be equal to ${
        MessageStatusEnum.Undeclared
      }`,
    );

    await gatewayBase.setOutboxStatus(messageHash, MessageStatusEnum.Declared);
    status = await gatewayBase.getOutboxMessageStatus(messageHash);

    assert.strictEqual(
      status.eqn(MessageStatusEnum.Declared),
      true,
      `Message status ${status.toString(10)} must be equal to ${
        MessageStatusEnum.Declared
      }`,
    );

    await gatewayBase.setOutboxStatus(
      messageHash,
      MessageStatusEnum.Progressed,
    );
    status = await gatewayBase.getOutboxMessageStatus(messageHash);

    assert.strictEqual(
      status.eqn(MessageStatusEnum.Progressed),
      true,
      `Message status ${status.toString(10)} must be equal to ${
        MessageStatusEnum.Progressed
      }`,
    );

    await gatewayBase.setOutboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );
    status = await gatewayBase.getOutboxMessageStatus(messageHash);

    assert.strictEqual(
      status.eqn(MessageStatusEnum.DeclaredRevocation),
      true,
      `Message status ${status.toString(10)} must be equal to ${
        MessageStatusEnum.DeclaredRevocation
      }`,
    );

    await gatewayBase.setOutboxStatus(messageHash, MessageStatusEnum.Revoked);
    status = await gatewayBase.getOutboxMessageStatus(messageHash);

    assert.strictEqual(
      status.eqn(MessageStatusEnum.Revoked),
      true,
      `Message status ${status.toString(10)} must be equal to ${
        MessageStatusEnum.Revoked
      }`,
    );
  });
});
