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

const web3 = require('../../test_lib/web3.js');
const Utils = require('../../test_lib/utils.js');
const BN = require('bn.js');

const Organization = artifacts.require('Organization');

contract('Organization.isOrganization()', async (accounts) => {

    let owner = accounts[0];
    let admin = accounts[1];
    let worker = accounts[2];
    let organization = null;

    beforeEach(async function () {
        let zeroAdmin = Utils.NULL_ADDRESS;
        let workers = [];
        let expirationHeight = 0;

        organization = await Organization.new(
            owner,
            zeroAdmin,
            workers,
            expirationHeight,
        );
    });

    it('should return the owner as the organization', async () => {
        let isOrganization = await organization.isOrganization(owner);

        assert.strictEqual(
            isOrganization,
            true,
            'The owner should be recognized as organization.',
        );
    });

    it('should return the admin as the organization', async () => {
        await organization.setAdmin(admin, { from: owner });
        let isOrganization = await organization.isOrganization(admin);

        assert.strictEqual(
            isOrganization,
            true,
            'The admin should be recognized as organization.',
        );
    });

    it('should not return a worker as the organization', async () => {
        let currentBlockHeight = await web3.eth.getBlockNumber();
        let expirationHeight = currentBlockHeight + 1000;
        await organization.setWorker(
            worker,
            new BN(expirationHeight),
            { from: owner },
        );
        let isOrganization = await organization.isOrganization(admin);

        assert.strictEqual(
            isOrganization,
            false,
            'A worker should not be recognized as organization.',
        );
    });

});
