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
 * Contains all relevant data on a chain.
 *
 * @property {Web3} web3 A web3 object to access the chain.
 * @property {Object} contractAddresses All addresses in string format, indexed
 *     by the contract name, as written in the solidity source file.
 * @property {Object} contracts Instances of TruffleContracts. Indexed by their
 *     identifier, e.g. `EIP20Gateway` or `Anchor`. Exception: `BaseToken`
 *     and `Token` are not called EIP20StandardToken to differentiate
 *     the two.
 * @property {string} deployerAddress The address of the account that deployed
 *     the contracts in the deployment phase.
 * @property {string} organizationAddress The address of the organization.
 * @property {string} networkId The network ID of this chain.
 * @property {string []} accounts List of external accounts of this chain.
 */
class Chain {
  constructor() {
    this.web3 = {};
    this.contractAddresses = {};
    this.contracts = {};
    this.deployerAddress = '';
    this.organizationAddress = '';
    this.networkId = '*';
    this.accounts = [];
  }

  /**
     * Adds a new contract instance to the chain.
     *
     * @param {string} contractName The name of the contract to add.
     * @param {string} [identifier] Optionally an identifier that differs from the
     *     contract name. The property on the `contractAddresses` that holds
     *     this contract.
     */
  async addContract(contractName, identifier = contractName) {
    const Contract = shared.artifacts[contractName].clone(this.networkId);
    Contract.setProvider(this.web3.currentProvider);
    this.contracts[identifier] = await Contract.at(
      this.contractAddresses[identifier],
    );
  }
}

/**
 * An object that is shared across modules.
 *
 * @property {Chain} origin The origin chain.
 * @property {Chain} auxiliary The auxiliary chain.
 * @property {Object} artifacts The truffle artifacts of the contracts. Indexed
 *     by the contract name, as written in the solidity source
 *     file.
 */
const shared = {
  origin: new Chain(),
  auxiliary: new Chain(),
  artifacts: {},
};

/**
 * @returns {Shared} The shared object.
 */
module.exports = shared;
