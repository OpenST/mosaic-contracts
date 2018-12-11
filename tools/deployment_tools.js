const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const STATE_NEW = 'new';
const STATE_LINKED = 'linked';
const STATE_INSTANTIATED = 'instantiated';

class Contract {
    /**
     * @param {string} contractName Name of the contract to create. If this contract is
     *                 linked into another contracted, the provided contractName has to
     *                 match the linking placeholder.
     * @param {string} contracBytecode Bytecode of the contract.
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
        this._linkBytecodeReplacement = this._linkBytecodeReplacement.bind(this);
        this._linkBytecode = this._linkBytecode.bind(this);
        this.addLinkedDependency = this.addLinkedDependency.bind(this);
        this.getAddress = this.getAddress.bind(this);
        this.instantiate = this.instantiate.bind(this);
        this.linkedBytecode = this.linkedBytecode.bind(this);
        this.setAddress = this.setAddress.bind(this);
    }

    /**
     * Helper for loading a contract saved in a format followin the truffle-contract-schema.
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
     * Returns the contract's address as detemined by the provided AddressGenerator.
     *
     * @param {Object|string} addressGeneratorOrAddress The AddressGenerator used for
     *                        generating the addresses. Can alternatively be a fixed address.
     * @returns {string} The contract's address.
     */
    setAddress(addressGeneratorOrAddress) {
        this._ensureState([STATE_NEW, STATE_LINKED]);
        // Return early if the address has previously been set.
        // This allows for setting a fixed address for specific contracts.
        if (this.address) {
            return this.address;
        }

        if (typeof addressGeneratorOrAddress === 'string') {
            this.address = addressGeneratorOrAddress;
            return this.address;
        }

        const addressGenerator = addressGeneratorOrAddress;
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
        this._ensureState([STATE_INSTANTIATED]);
        return this.address;
    }

    /**
     * Performs all linking for a contract and returns the linked bytecode.
     * Assumes that the addresses of all linked dependencies have previously been set.
     *
     * @returns {string} The linked bytecode of the contract.
     */
    linkedBytecode() {
        this._ensureState([STATE_LINKED, STATE_INSTANTIATED]);
        return this.contractBytecode;
    }

    /*
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

        let constructorData = this.linkedBytecode();
        if (this.constructorArgs) {
            const web3 = new Web3();
            const encodedArguments = web3.eth.abi
                .encodeParameters(this.constructorABI.inputs, this.constructorArgs)
                .slice(2);
            constructorData += encodedArguments;
        }

        this.constructorData = constructorData;
        this._state = STATE_INSTANTIATED;
        return constructorData;
    }

    /**
     * Helper for ensuring that the internal state machine is in the expected state.
     *
     * @param {string|Array<string>} stateOrStates One or multiple accepted states.
     */
    _ensureState(stateOrStates) {
        if (Array.isArray(stateOrStates)) {
            if (!stateOrStates.includes(this._state)) {
                throw new Error(`Can only do this action in one of the following states: ${JSON.stringify(stateOrStates)}. Currently in state "${this._state}".`);
            }
        } else if (this._state !== stateOrStates) {
            throw new Error(`Can only do this action in the "${stateOrStates}" state. Currently in state "${this._state}".`);
        }
    }

    /**
     * Replaces all linking placeholder in this contract's bytecode with address.
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

        this.linkReplacements.forEach((linkedContract) => {
            count += linkedContract._getDependenciesCount();
        });

        return count;
    }
}

/**
 * A simple AddressGenerator that returns auto-incremented addresses starting
 * from a provided address.
 * Suitable for genesis deployment.
 */
class IncrementingAddressGenerator {
    /**
     * @param {string} [startAddress=0x0000000000000000000000000000000000010000]
     *                  Address from which we generate
     *        (by incrementing) new addresses for contracts to deploy.
     */
    constructor(startAddress = '0x0000000000000000000000000000000000010000') {
        this.nextAvailableAddress = startAddress;
    }

    /**
     * Function returns next available address.
     *
     * @return {string} Next address to use as a pre-allocated address within
     *         genesis file for contract deployment.
     */
    generateAddress() {
        const addressHex = this.nextAvailableAddress;

        // Incrementing next available address.
        const nextAddressBN = Web3.utils.toBN(addressHex).add(Web3.utils.toBN('1'));
        this.nextAvailableAddress = `0x${Web3.utils.padLeft(nextAddressBN, 40)}`;

        return addressHex;
    }
}

/**
 * A contract registry that allows for registering contracts and planning deployment.
 */
class ContractRegistry {
    constructor() {
        this.contracts = [];

        this.addContract = this.addContract.bind(this);
        this.toParityGenesisAccounts = this.toParityGenesisAccounts.bind(this);
    }

    /**
     * Add a contract to the registry.
     *
     * @param {Contract} contracts Contract to add to the registry.
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
        this.contracts.forEach(contract => contract.setAddress(addressGenerator));
        this.contracts.forEach(contract => contract.instantiate());

        const output = {
        };

        Object.values(this.contracts)
            .forEach((contract) => {
                const address = contract.getAddress();
                const constructor = contract.constructorData;
                if (!constructor) {
                    throw new Error(`constructorData for contract ${contract.contractName} is missing. This probably means that .instantiate() has not been called for the contract`);
                }

                output[address] = {
                    balance: '0',
                    constructor,
                };
            });

        return output;
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
    Contract,
    ContractRegistry,
    IncrementingAddressGenerator,
};
