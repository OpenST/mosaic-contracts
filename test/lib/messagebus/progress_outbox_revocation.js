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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const messageBusUtilsKlass = require('./messagebus_utils');
    messageBusUtils = new messageBusUtilsKlass();

let MessageStatusEnum = {
    Undeclared: 0,
    Declared: 1,
    Progressed: 2,
    DeclaredRevocation: 3,
    Revoked: 4
};

contract('MessageBus.progressOutboxRevocation()', async (accounts) => {
    let params;

    beforeEach(async function () {

        await messageBusUtils.deployedMessageBus();
        params = messageBusUtils.defaultParams(accounts);
    });

    it('should fail target message is undeclared', async () => {
        let message = 'Message on target status must be Revoked.';
        params.message = message;

        params.messageStatus = MessageStatusEnum.Undeclared;
        await messageBusUtils.progressOutboxRevocation(params, false);
    });

    it('should fail target message is declared', async () => {
        let message = 'Message on target status must be Revoked.';
        params.message = message;

        params.messageStatus = MessageStatusEnum.Declared;
        await messageBusUtils.progressOutboxRevocation(params, false);
    });

    it('should fail target message is progressed', async () => {
        let message = 'Message on target status must be Revoked.';
        params.message = message;

        params.messageStatus = MessageStatusEnum.Progressed;
        await messageBusUtils.progressOutboxRevocation(params, false);
    });


    it('should fail when source message status is declared ', async () => {
        let message = 'Message on source must be DeclaredRevocation.';
        params.message = message;

        await messageBusUtils.declareMessage(params, true);
        params.messageStatus = MessageStatusEnum.Revoked;
        await messageBusUtils.progressOutboxRevocation(params, false);

    });

    it('should fail when source message status is progressed ', async () => {
        let message = 'Message on source must be DeclaredRevocation.';
        params.message = message;

        await messageBusUtils.declareMessage(params, true);
        await messageBusUtils.progressOutbox(params, true);
        params.messageStatus = MessageStatusEnum.Revoked;
        await messageBusUtils.progressOutboxRevocation(params, false);

    });

    it('should fail when source message status is revoked', async () => {
        let message = 'Message on source must be DeclaredRevocation.';
        params.message = message;

        await messageBusUtils.declareMessage(params, true);
        await messageBusUtils.declareRevocationMessage(params, true);
        params.messageStatus = MessageStatusEnum.Revoked;
        await messageBusUtils.progressOutboxRevocation(params, true);

        await messageBusUtils.progressOutboxRevocation(params, false);

    });
});

