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

const { assert } = require('chai');
const shared = require('../shared');

// Dummy to show that it can access the contracts and make transactions.
describe('Stake', async () => {
    it('stakes', async () => {
        const brandedToken = shared.origin.contracts.Token;
        const sender = shared.origin.deployerAddress;
        const accounts = await shared.origin.web3.eth.getAccounts();
        const receiver = accounts[2];
        const amount = '1000000';

        await brandedToken.transfer(receiver, amount, { from: sender });
        const balanceOfReceiver = await brandedToken.balanceOf.call(receiver);

        assert.strictEqual(
            amount,
            balanceOfReceiver.toString(10),
            'Could not transfer EIP20 tokens.',
        );
    });
});
