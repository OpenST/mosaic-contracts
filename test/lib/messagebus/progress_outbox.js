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

const messageBusUtilsKlass = require('./messagebus_utils'),
    web3 = require('web3');
const messageBusUtils = new messageBusUtilsKlass();

let MessageStatusEnum = {
    Undeclared: 0,
    Declared: 1,
    Progressed: 2,
    DeclaredRevocation: 3,
    Revoked: 4
};
contract('MessageBus.progressOutbox()', async (accounts) => {
    let params;

    beforeEach(async function () {

        await messageBusUtils.deployedMessageBus();
        params = messageBusUtils.defaultParams(accounts);
    });

    it('should fail when message status is undeclared in outbox', async () => {
        let message = 'Message on source must be Declared.';
        params.message = message;

        await messageBusUtils.progressOutbox(params, false);

    });

    it('should fail when message status is already progressed in outbox', async () => {
        let message = 'Message on source must be Declared.';
        params.message = message;

        await messageBusUtils.declareMessage(params, true);
        await messageBusUtils.progressOutbox(params, true);
        await messageBusUtils.progressOutbox(params, false);

    });

    it('should fail when message status is declared revocation in outbox', async () => {
        let message = 'Message on source must be Declared.';
        params.message = message;

        await messageBusUtils.declareMessage(params, true);
        await messageBusUtils.declareRevocationMessage(params, true);
        await messageBusUtils.progressOutbox(params, false);

    });

    it('should fail when message status is revoked in outbox', async () => {
        let message = 'Message on source must be Declared.';
        params.message = message;

        await messageBusUtils.declareMessage(params, true);
        await messageBusUtils.declareRevocationMessage(params, true);
        params.messageStatus = MessageStatusEnum.Revoked;
        await messageBusUtils.progressOutboxRevocation(params, true);
        await messageBusUtils.progressOutbox(params, false);

    });

    it('should fail when unlock secret is incorrect', async () => {
        let message = 'Invalid unlock secret.';
        params.message = message;

        params.unlockSecret = web3.utils.soliditySha3({
            type: 'bytes32',
            value: 'secret1'
        });
        await messageBusUtils.progressOutbox(params, false);

    });
});
