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

const {
    IncrementingAddressGenerator,
    IncrementingNonceAddressGenerator,
} = require('./address_generators');

/**
 * A contract registry that allows for registering contracts and planning deployment.
 */
class ContractRegistry {
    constructor() {
        this.contracts = [];

        this.addContract = this.addContract.bind(this);
        this.toParityGenesisAccounts = this.toParityGenesisAccounts.bind(this);
        this.toLiveTransactionObjects = this.toLiveTransactionObjects.bind(this);
    }

    /**
     * Add a contract to the registry.
     *
     * @param {Contract} contract Contract to add to the registry.
     */
    addContract(contract) {
        this.contracts.push(contract);
    }

    /**
     * Add multiple contracts to the registry. See {@link ContractRegistry#addContract}.
     *
     * @param {Array.<Contract>} contracts Contracts to add to the registry.
     */
    addContracts(contracts) {
        contracts.forEach(contract => this.addContract(contract));
    }

    /**
     * Generate the "accounts" object for a parity chainspec for all the contracts have been added.
     * For that the { "0x...": { "constructor": "0x..." } } version of account intialization
     * which is currently exclusive to parity is used.
     *
     * See {@link https://wiki.parity.io/Chain-specification} for more details on the
     * parity chainspec format.
     *
     * If you are looking for an alternative for live deployments,
     * see {@link ContractRegistry#toLiveTransactionObjects}.
     *
     * @param {Object} options.addressGenerator Address generator to use.
     *                 Defaults to a IncrementingAddressGenerator.
     *
     * @returns {object} The "accounts" section for a parity chainspec.
     */
    toParityGenesisAccounts(options = {}) {
        const defaultOptions = {
            addressGenerator: new IncrementingAddressGenerator(),
        };
        const mergedOptions = Object.assign(defaultOptions, options);

        // prepare contracts by ordering and generating addresses
        const { addressGenerator } = mergedOptions;
        this._orderContracts();
        this.contracts.forEach(contract => contract.setGeneratedAddress(addressGenerator));
        this.contracts.forEach(contract => contract.instantiate());

        const genesisAccounts = {
        };

        this.contracts
            .forEach((contract) => {
                const address = contract.getAddress();
                const constructor = contract.constructorData;

                genesisAccounts[address] = {
                    balance: '0',
                    constructor,
                };
            });

        return genesisAccounts;
    }

    /**
     * Generate transaction objects that can be passed as an argument
     * to `web3.eth.sendTransaction()`.
     * This allows for deployment on a live network.
     *
     * If you are looking for an alternative for genesis deployments,
     * see {@link ContractRegistry#toParityGenesisAccounts}.
     *
     * @param {string} fromAddress See {@link IncrementingNonceAddressGenerator#constructor}.
     * @param {number} startingNonce See {@link IncrementingNonceAddressGenerator#constructor}.
     *
     * @returns {Array.<object>} The transaction objects that can be used for deployment.
     */
    toLiveTransactionObjects(fromAddress, startingNonce) {
        const addressGenerator = new IncrementingNonceAddressGenerator(fromAddress, startingNonce);

        this._orderContracts();
        this.contracts.forEach(contract => contract.setGeneratedAddress(addressGenerator));
        this.contracts.forEach(contract => contract.instantiate());

        const transactionObjects = [];
        this.contracts
            .forEach((contract, i) => {
                const transactionObject = {
                    // fields for web3.eth.sendTransaction()
                    from: fromAddress,
                    data: contract.constructorData,
                    nonce: startingNonce + i,
                };
                const deploymentObject = {
                    transactionObject,
                    // metadata
                    address: contract.getAddress(),
                    contractName: contract.contractName,
                };
                transactionObjects.push(deploymentObject);
            });

        return transactionObjects;
    }

    /**
     * Orders all contracts in the order of sequential deployment.
     * This is determined by the amount of transitive dependencies (including self).
     */
    _orderContracts() {
        this.contracts.sort((a, b) => a._getDependenciesCount() - b._getDependenciesCount());
    }
}

module.exports = {
    ContractRegistry,
};
