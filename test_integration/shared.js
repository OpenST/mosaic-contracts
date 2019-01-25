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
 * @file `shared` exists so that integration tests can share data among each other.
 *
 * One example is the addresses of contracts that were deployed on the test
 * environment.
 *
 * Due to node's caching behavior when loading modules, it always returns the
 * same object for repeated calls to `require()`.
 *
 * It is important that every `require` is written exactly `shared`,
 * case-sensitive!
 */

/**
 * @typedef {Object} Chain Contains all relevant data on a chain.
 * @property {Web3} web3 A web3 object to access the chain.
 * @property {Object} addresses All addresses in sting format, indexed by the
 *     contract name, as written in the solidity source file.
 * @property {Object} contracts Instances of TruffleContracts. Indexed by their
 *     instance name, e.g. `gateway` or `anchor`.
 */

/**
 * @typedef {Object} Shared An object that is shared across modules.
 * @property {Chain} origin The origin chain.
 * @property {Chain} auxiliary The auxiliary chain.
 * @property {Object} artifacts The truffle artifacts of the contracts. Indexed
 *     by the contract name, as written in the solidity source
 *     file.
 */

/**
 * @returns {Shared} The shared object.
 */
module.exports = {
    origin: {
        web3: {},
        addresses: [],
        contracts: [],
    },
    auxiliary: {
        web3: {},
        addresses: [],
        contracts: [],
    },
    artifacts: [],
};
