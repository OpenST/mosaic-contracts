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

/**
 * @file Truffle's `artifacts.require()` won't be available inside the Mocha
 * tests. Thus, we load them here and add them to the `shared` object.
 */
const Mocha = require('mocha');
const shared = require('./shared');

const Anchor = artifacts.require('Anchor');
const Gateway = artifacts.require('EIP20Gateway');
const CoGateway = artifacts.require('EIP20CoGateway');


const setupArtifacts = () => {
    shared.artifacts.Anchor = Anchor;
    shared.artifacts.Gateway = Gateway;
    shared.artifacts.CoGateway = CoGateway;
};

const runTests = (callback) => {
    const mocha = new Mocha({
        enableTimeouts: false,
    });

    Mocha.utils.lookupFiles(__dirname, ['js'], true)
        .filter(
            // Skipping this file so that artifacts are not loaded.
            file => file.substr(-20) !== 'integration_tests.js',
        )
        .forEach((file) => {
            mocha.addFile(file);
        });

    mocha.run((failures) => {
        callback(failures);
    });
};

module.exports = (callback) => {
    setupArtifacts();
    runTests(callback);
};
