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

const web3 = require('../../test_lib/web3.js');
const BN = require('bn.js');

const Organization = artifacts.require('Organization');

contract('Organization.isOwner()', async (accounts) => {

    let owner = accounts[0];
    let admin = accounts[1];
    let worker = accounts[2];
    let organization = null;

    beforeEach(async function () {
        organization = await Organization.new({ from: owner });
    });

    it('should return the owner as the owner', async () => {
        let isOwner = await organization.isOwner(owner);

        assert.strictEqual(
            isOwner,
            true,
            'The owner should be recognized as owner.',
        );
    });

    it('should return the admin as the owner', async () => {
        await organization.setAdmin(admin, { from: owner });
        let isOwner = await organization.isOwner(admin);

        assert.strictEqual(
            isOwner,
            true,
            'The admin should be recognized as owner.',
        );
    });

    it('should not return a worker as the owner', async () => {
        let currentBlockHeight = await web3.eth.getBlockNumber();
        let expirationHeight = currentBlockHeight + 1000;
        await organization.setWorker(
            worker,
            new BN(expirationHeight),
            { from: owner },
        );
        let isOwner = await organization.isOwner(admin);

        assert.strictEqual(
            isOwner,
            false,
            'A worker should not be recognized as owner.',
        );
    });

});
