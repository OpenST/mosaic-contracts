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

const web3 = require('web3');
const MessageBusUtils = require('./messagebus_utils');

contract('MessageBus.progressInbox()', async (accounts) => {
  let params;

  beforeEach(async () => {
    await MessageBusUtils.deployedMessageBus();
    params = MessageBusUtils.defaultParams(accounts);
  });

  it('should fail when message status is undeclared in inbox', async () => {
    const message = 'Message on target status must be Declared.';
    params.message = message;

    await MessageBusUtils.progressInbox(params, false);
  });

  it('should fail when message status is already progressed in inbox', async () => {
    const message = 'Message on target status must be Declared.';
    params.message = message;

    await MessageBusUtils.confirmMessage(params, true);
    await MessageBusUtils.progressInbox(params, true);

    await MessageBusUtils.progressInbox(params, false);
  });

  it('should fail when message status is revoked in inbox', async () => {
    const message = 'Message on target status must be Declared.';
    params.message = message;

    await MessageBusUtils.confirmMessage(params, true);
    await MessageBusUtils.confirmRevocation(params, true);

    await MessageBusUtils.progressInbox(params, false);
  });

  it('should fail when unlock secret is incorrect', async () => {
    const message = 'Invalid unlock secret.';
    params.message = message;

    await MessageBusUtils.confirmMessage(params, true);
    params.unlockSecret = web3.utils.soliditySha3({
      type: 'bytes32',
      value: 'secret1',
    });
    await MessageBusUtils.progressInbox(params, false);
  });
});
