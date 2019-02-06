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

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const STATE_NEW = 'new';
const STATE_LINKED = 'linked';
const STATE_INSTANTIATED = 'instantiated';

const TYPE_CONTRACT_REFERENCE = 'contract_reference';

class Contract {
  /**
   * @param {string} contractName Name of the contract to create. If this contract is
   *                 linked into another contracted, the provided contractName has to
   *                 match the linking placeholder.
   * @param {string} contractBytecode Bytecode of the contract.
   * @param {Array<*>} [constructorABI] ABI of the contract constructor.
   * @param {Array<*>} [constructorArgs] Arguments for the contract constructor.
   */
  constructor(contractName, contractBytecode, constructorABI, constructorArgs) {
    this.contractName = contractName;
    this.contractBytecode = contractBytecode;
    this.constructorABI = constructorABI;
    this.constructorArgs = constructorArgs;

    // initialize state machine
    this._state = STATE_NEW;
    this.linkReplacements = [];

    this._checkFullyLinked = this._checkFullyLinked.bind(this);
    this._getDependenciesCount = this._getDependenciesCount.bind(this);
    this._linkBytecode = this._linkBytecode.bind(this);
    this._linkBytecodeReplacement = this._linkBytecodeReplacement.bind(this);
    this.addLinkedDependency = this.addLinkedDependency.bind(this);
    this.getAddress = this.getAddress.bind(this);
    this.instantiate = this.instantiate.bind(this);
    this.linkedBytecode = this.linkedBytecode.bind(this);
    this.reference = this.reference.bind(this);
    this.setAddress = this.setAddress.bind(this);
    this.setGeneratedAddress = this.setGeneratedAddress.bind(this);
  }

  /**
   * Helper for loading a contract saved in a format following the truffle-contract-schema.
   *
   * See {@link https://github.com/trufflesuite/truffle/tree/66e3b1cb10df881d80e2a22ddea68e9dcfbdcdb1/packages/truffle-contract-schema}
   *
   * @param {string} contractName Name of the contract to load.
   * @param {Array<*>} constructorArgs Arguments for the contract constructor.
   * @param {object} options
   * @param {string} options.rootDir The root directory of node project that is using truffle.
   *                 Contract build artifacts are expected to be located at
   *                 `rootDir/build/contracts`.
   */
  static loadTruffleContract(contractName, constructorArgs, options = {}) {
    const defaultOptions = {
      rootDir: `${__dirname}/../`,
    };
    const mergedOptions = Object.assign(defaultOptions, options);

    const contractPath = path.join(mergedOptions.rootDir, `build/contracts/${contractName}.json`);
    const contents = fs.readFileSync(contractPath);
    const truffleJson = JSON.parse(contents);

    const constructorAbi = truffleJson.abi.find(n => n.type === 'constructor');

    return new Contract(
      truffleJson.contractName,
      truffleJson.bytecode,
      constructorAbi,
      constructorArgs,
    );
  }

  /**
   * Add a linked dependency to the contract.
   */
  addLinkedDependency(linkedContract) {
    this._ensureState(STATE_NEW);
    this.linkReplacements.push(linkedContract);
  }

  /**
   * Set the address of the contract to a fixed address.
   *
   * See {@link Contract#setGeneratedAddress} for setting an address for the contract
   * via an AddressGenerator instead.
   *
   * @param {string} address The fixed address to use for this contract.
   * @returns {string} The contract's address.
   */
  setAddress(address) {
    this._ensureStateOneOf([STATE_NEW, STATE_LINKED]);
    if (typeof address !== 'string') {
      throw new Error(`Invalid address provided for ${this.contractName}`);
    }

    this.address = address;
    return this.address;
  }

  /**
   * Set the address by generating an address with provided AddressGenerator,
   * and return that address.
   *
   * See {@link Contract#setAddress} for setting a fixed address for the contract instead.
   *
   * @param {Object} addressGenerator The AddressGenerator used for generating the addresses.
   * @returns {string} The contract's address.
   */
  setGeneratedAddress(addressGenerator) {
    this._ensureStateOneOf([STATE_NEW, STATE_LINKED]);
    // Return early if the address has previously been set, so we don't overwrite it.
    // This allows for setting a fixed address for specific contracts via `setAddress`.
    if (this.address) {
      return this.address;
    }

    if (!addressGenerator) {
      throw new Error(`addressGenerator not provided when generating address for ${this.contractName}`);
    }

    const address = addressGenerator.generateAddress();
    this.address = address;
    return this.address;
  }

  /**
   * Get the address of an instantiated contract.
   *
   * @returns {string} The address of the instantiated contract.
   */
  getAddress() {
    this._ensureState(STATE_INSTANTIATED);
    return this.address;
  }

  /**
   * Returns the previously linked bytecode.
   *
   * @returns {string} The linked bytecode of the contract.
   */
  linkedBytecode() {
    this._ensureStateOneOf([STATE_LINKED, STATE_INSTANTIATED]);
    return this.contractBytecode;
  }

  /**
   * Instantiate the contract by calculating the data of the contract creation transaction.
   * This includes encoding the provided constructor arguments.
   * Freezes the object to prevent any further changes.
   *
   * @return {string} The transaction data for contract creation.
   */
  instantiate() {
    this._ensureState(STATE_NEW);

    if (this.constructorABI && !this.constructorArgs) {
      throw new Error(`Expected constructor arguments for constract ${this.contractName}`);
    }
    if (this.constructorArgs && !this.constructorABI) {
      throw new Error(`Provided arguments for contract ${this.contractName}, but no constructorAbi is set.`);
    }

    this._linkBytecode();

    // Build the data for used for the deployment transaction, which consists
    // of the linked bytecode, optionally concatenated with the arguments to the
    // constructor (if there are any).
    let constructorData = this.linkedBytecode();
    constructorData += this._encodeConstructorArguments();

    this.constructorData = constructorData;
    this._state = STATE_INSTANTIATED;
    return constructorData;
  }

  /**
   * Returns a reference to the contract, which can be used as a placeholder for
   * a contract address in constructor arguments.
   *
   * @returns {object} A reference to this contract.
   */
  reference() {
    return {
      __type: TYPE_CONTRACT_REFERENCE,
      contract: this,
    };
  }

  /**
   * Checks if the provided constructor argument is a contract reference,
   *
   * @param {*} constructorArg A constructor argument that is possibly a contract reference.
   *
   * @returns {bool} Whether the provided argument is a contract reference.
   */
  _isContractReference(constructorArg) {
    if (constructorArg === null) {
      return false;
    }

    return constructorArg.__type === TYPE_CONTRACT_REFERENCE;
  }

  /**
   * Tries to interpret the provided constructor argument as a contract reference,
   * and returns the referenced contract if it is one. See {@link Contract#reference}.
   *
   * @param {*} constructorArg A constructor argument that is possibly a contract reference.
   *
   * @returns {Contract|null} The referenced contract.
   */
  _getReferenceContract(constructorArg) {
    if (!this._isContractReference(constructorArg)) {
      return null;
    }

    return constructorArg.contract;
  }

  /**
   * Helper for ensuring that the internal state machine is in the expected state.
   *
   * @param {Array<string>} states Multiple accepted states.
   */
  _ensureStateOneOf(states) {
    if (!states.includes(this._state)) {
      throw new Error(`Can only do this action in one of the following states: ${JSON.stringify(states)}. Currently in state "${this._state}".`);
    }
  }

  /**
   * Helper for ensuring that the internal state machine is in the expected state.
   *
   * See {@link Contract#_ensureStateOneOf}.
   *
   * @param {string} state The accepted states.
   */
  _ensureState(state) {
    this._ensureStateOneOf([state]);
  }

  /**
   * Encodes the constructor arguments that have been set for the contract.
   * Also takes care of dereferencing Contract references. See {@link Contract#reference}.
   *
   * @return {string} The encoded constructor arguments.
   */
  _encodeConstructorArguments() {
    if (!this.constructorArgs) {
      return '';
    }

    const web3 = new Web3();

    const dereferencedConstructorArgs = this.constructorArgs.map((constructorArg) => {
      const referenceContract = this._getReferenceContract(constructorArg);
      if (referenceContract) {
        return referenceContract.getAddress();
      }

      return constructorArg;
    });

    const encodedArguments = web3.eth.abi
      .encodeParameters(this.constructorABI.inputs, dereferencedConstructorArgs)
      .slice(2); // Cut of leading '0x'

    return encodedArguments;
  }

  /**
   * Replaces all linking placeholder in this contract's bytecode with addresses.
   * Assumes that the addresses of all linked dependencies have previously been set.
   *
   * See {@link Contract#_linkBytecodeReplacement}.
   */
  _linkBytecode() {
    this._ensureState(STATE_NEW);

    this.linkReplacements.forEach(
      (linkedContract) => {
        this.contractBytecode = this._linkBytecodeReplacement(
          linkedContract.contractName,
          linkedContract.getAddress(),
        );
      },
    );

    if (!this._checkFullyLinked()) {
      throw new Error(
        `Contract ${this.contractName} has not been fully linked. This means that a link dependency has not been specified.`,
      );
    }

    this._state = STATE_LINKED;
  }

  /**
   * Replaces linking placeholder in this contract's bytecode with address.
   *
   * @param {string} contractName Name of the contract, as specified in the linking placeholder.
   * @param {string} contractAddress Address of the linked contract that will be used.
   * @return {string} The linked bytecode.
   */
  _linkBytecodeReplacement(contractName, contractAddress) {
    let pattern = `__${contractName}______________________________________`;
    pattern = pattern.slice(0, 40);
    const address = contractAddress.replace('0x', '');

    return this.contractBytecode.replace(new RegExp(pattern, 'g'), address);
  }

  /**
   * Checks if the bytecode of this contract is fully linked
   * (= it contains no linking placeholders).
   *
   * @return {bool}
   */
  _checkFullyLinked() {
    if (!this.contractBytecode) {
      return false;
    }
    return !this.contractBytecode.includes('_');
  }

  /**
   * Recursively calculates the count of transitive dependencies.
   * This can be used to determine the ordering of contracts for deployment.
   *
   * @return {number} The count of transitive dependencies.
   */
  _getDependenciesCount() {
    // start at 1 because we are also counting the contract itself
    let count = 1;

    let constructorDependencies = [];
    if (this.constructorArgs) {
      constructorDependencies = this.constructorArgs
        .map(n => this._getReferenceContract(n))
        .filter(Boolean);
    }
    constructorDependencies.forEach((referencedContract) => {
      count += referencedContract._getDependenciesCount();
    });

    this.linkReplacements.forEach((linkedContract) => {
      count += linkedContract._getDependenciesCount();
    });

    return count;
  }
}

module.exports = {
  Contract,
};
