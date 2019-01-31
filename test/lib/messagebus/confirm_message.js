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
//
const messageBusUtilsKlass = require('./messagebus_utils'),
    messageBusUtils = new messageBusUtilsKlass();

contract('MessageBus.confirmMessage()', async (accounts) => {
     let params;

    beforeEach(async function () {

        await messageBusUtils.deployedMessageBus();
        params = messageBusUtils.defaultParams(accounts);
    });

    it('should fail when message status is declared ', async () => {
        let message = 'Message on target must be Undeclared.';
        params.message = message;

        await messageBusUtils.confirmMessage(params, true);

        await messageBusUtils.confirmMessage(params, false);

    });

    it('should fail when message status is progressed ', async () => {
        let message = 'Message on target must be Undeclared.';
        params.message = message;

        await messageBusUtils.confirmMessage(params, true);
        await messageBusUtils.progressInbox(params, true);

        await messageBusUtils.confirmMessage(params, false);

    });

    it('should fail when message status is revoked ', async () => {
        let message = 'Message on target must be Undeclared.';
        params.message = message;
        await messageBusUtils.confirmMessage(params, true);
        await messageBusUtils.confirmRevocation(params, true);

        await messageBusUtils.confirmMessage(params, false);

    });
});


