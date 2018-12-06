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

const Utils = require('../../test_lib/utils.js');

const Organization = artifacts.require('Organization');
const Organized = artifacts.require('Organized');

contract('Organized.constructor()', async (accounts) => {

    let owner = accounts[0];
    let organization = null;

    beforeEach(async function () {
        organization = await Organization.new({ from: owner });
    });

    it('reverts when organization address is null', async () => {
        await Utils.expectRevert(
            Organized.new(
                '0x0000000000000000000000000000000000000000',
                { from: owner },
            ),
            // Escaping as a regular expression is expected.
            'Organization contract address must not be address\\(0\\)\\.',
        );

    });

    it('checks that valid organization address is set', async () => {
        organized = await Organized.new(organization.address, { from: owner });
        assert.strictEqual(
            await organized.organization.call(),
            organization.address,
            'The organized contract should store the given organization.',
        );
    });

});
