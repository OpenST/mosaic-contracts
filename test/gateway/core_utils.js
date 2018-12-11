// Copyright 2017 OpenST Ltd.
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
// Test: core_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const SafeCore = artifacts.require("./SafeCore.sol")
    , Organization = artifacts.require("MockOrganization.sol")
    , proof = require('../data/proof');
;

/// @dev Deploy 
module.exports.deployCore = async (artifacts, accounts) => {
    const chainIdRemote = 1410;
    const organizationOwner = accounts[7];
    const worker = accounts[8];

    // Deploy worker contract
    const organization = await Organization.new(organizationOwner, worker);
    const core = await SafeCore.new(
        chainIdRemote,
        0,
        proof.account.stateRoot,
        organization.address,
        { from: accounts[0] },
    );
    return {
        core: core,
        owner: organizationOwner,
        worker: worker,
        chainIdRemote: chainIdRemote,
    };
};

module.exports.checkStateRootAvailableEvent = (event, _blockHeight, _stateRoot) => {
    assert.equal(event !== null, true);
    assert.equal(event["_blockHeight"], _blockHeight);
    assert.equal(event["_stateRoot"], _stateRoot);
};

