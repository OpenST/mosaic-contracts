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

contract('MessageBus.declareRevocationMessage()', async (accounts) => {
  let params;

  beforeEach(async () => {
    await MessageBusUtils.deployedMessageBus();
    params = MessageBusUtils.defaultParams(accounts);
  });

  it('should fail when message status is undeclared in outbox', async () => {
    const message = 'Message on source must be Declared.';
    params.message = message;

    await MessageBusUtils.declareRevocationMessage(params, false);
  });

  it('should fail when message status is Progressed in outbox', async () => {
    const message = 'Message on source must be Declared.';
    params.message = message;

    await MessageBusUtils.declareMessage(params, true);
    await MessageBusUtils.progressOutbox(params, true);

    await MessageBusUtils.declareRevocationMessage(params, false);
  });

  it('should fail when message status is DeclaredRevocation in outbox', async () => {
    const message = 'Message on source must be Declared.';
    params.message = message;

    await MessageBusUtils.declareMessage(params, true);
    await MessageBusUtils.declareRevocationMessage(params, true);

    await MessageBusUtils.declareRevocationMessage(params, false);
  });

  it('should fail when message status is Revoked in outbox', async () => {
    const message = 'Message on source must be Declared.';
    params.message = message;

    await MessageBusUtils.declareMessage(params, true);
    await MessageBusUtils.declareRevocationMessage(params, true);
    params.messageStatus = MessageStatusEnum.Revoked;
    await MessageBusUtils.progressOutboxRevocation(params, true);

    await MessageBusUtils.declareRevocationMessage(params, false);
  });
});
