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
// Test: Core_utils.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Core = artifacts.require("./Core.sol")
    , SimpleToken = artifacts.require("./SimpleToken/SimpleToken.sol")
    , Workers = artifacts.require("./Workers.sol")
    , accountProof = require('./data/AccountProof');
;

const BigNumber = require('bignumber.js')
;

/// @dev Deploy 
module.exports.deployCore = async (artifacts, accounts) => {
    const registrar = accounts[1]
        , admin = accounts[2]
        , ops = accounts[3]
        , openSTRemote = accountProof.openSTRemoteAddress
        , chainIdOrigin = 3
        , chainIdRemote = 1410
        , valueToken = await SimpleToken.new()
        , deactivationHeight = new BigNumber(web3.toWei(100000000, "ether"))
        , worker1 = accounts[7]
    ;

    //Set SimpleToken admin in order to finalize SimpleToken
    await valueToken.setAdminAddress(admin);

    // Deploy worker contract
    const workers = await Workers.new(valueToken.address);
    await workers.setAdminAddress(admin);
    await workers.setOpsAddress(ops);
    await workers.setWorker(worker1, deactivationHeight, {from: ops});
    const core = await Core.new(registrar, chainIdOrigin, chainIdRemote, openSTRemote, workers.address, {from: accounts[0]});
    return {
        core: core,
        workerContract: workers,
        worker: worker1,
        registrar: registrar,
        chainIdRemote: chainIdRemote,
        chainIdOrigin: chainIdOrigin
    };
};

module.exports.checkOpenSTProvenEvent = (event, _blockHeight, _storageRoot, wasAlreadyProved) => {
    assert.equal(event !== null, true);
    assert.equal(event["blockHeight"], _blockHeight);
    assert.equal(event["storageRoot"], _storageRoot);
    assert.equal(event["wasAlreadyProved"], wasAlreadyProved);
};

module.exports.checkStateRootCommittedEvent = (event, _blockHeight, _stateRoot) => {
    assert.equal(event !== null, true);
    assert.equal(event["blockHeight"], _blockHeight);
    assert.equal(event["stateRoot"], _stateRoot);
};
