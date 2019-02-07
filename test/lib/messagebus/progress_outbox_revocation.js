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

const MessageBusUtils = require('./messagebus_utils');
const messageBus = require('../../test_lib/message_bus.js');

const { MessageStatusEnum } = messageBus;

contract('MessageBus.progressOutboxRevocation()', async (accounts) => {
  let params;

  beforeEach(async () => {
    await MessageBusUtils.deployedMessageBus();
    params = MessageBusUtils.defaultParams(accounts);
  });

  it('should fail target message is undeclared', async () => {
    const message = 'Message on target status must be Revoked.';
    params.message = message;

    params.messageStatus = MessageStatusEnum.Undeclared;
    await MessageBusUtils.progressOutboxRevocation(params, false);
  });

  it('should fail target message is declared', async () => {
    const message = 'Message on target status must be Revoked.';
    params.message = message;

    params.messageStatus = MessageStatusEnum.Declared;
    await MessageBusUtils.progressOutboxRevocation(params, false);
  });

  it('should fail target message is progressed', async () => {
    const message = 'Message on target status must be Revoked.';
    params.message = message;

    params.messageStatus = MessageStatusEnum.Progressed;
    await MessageBusUtils.progressOutboxRevocation(params, false);
  });

  it('should fail when source message status is declared ', async () => {
    const message = 'Message status on source must be DeclaredRevocation.';
    params.message = message;

    await MessageBusUtils.declareMessage(params, true);
    params.messageStatus = MessageStatusEnum.Revoked;
    await MessageBusUtils.progressOutboxRevocation(params, false);
  });

  it('should fail when source message status is progressed ', async () => {
    const message = 'Message status on source must be DeclaredRevocation.';
    params.message = message;

    await MessageBusUtils.declareMessage(params, true);
    await MessageBusUtils.progressOutbox(params, true);
    params.messageStatus = MessageStatusEnum.Revoked;
    await MessageBusUtils.progressOutboxRevocation(params, false);
  });

  it('should fail when source message status is revoked', async () => {
    const message = 'Message status on source must be DeclaredRevocation.';
    params.message = message;

    await MessageBusUtils.declareMessage(params, true);
    await MessageBusUtils.declareRevocationMessage(params, true);
    params.messageStatus = MessageStatusEnum.Revoked;
    await MessageBusUtils.progressOutboxRevocation(params, true);

    await MessageBusUtils.progressOutboxRevocation(params, false);
  });
});
