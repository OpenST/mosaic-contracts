const Web3 = require('web3');
const fs = require('fs');

class Contract {
    constructor(contractName, contractBytecode, constructorABI) {
        this.contractName = contractName;
        this.contractBytecode = contractBytecode;
        this.constructorABI = constructorABI;

        this.linkReplacements = [];

        this.addLinkedDependency = this.addLinkedDependency.bind(this);
    }

    /**
     * Helper for loading a contract saved in a format followin the truffle-contract-schema.
     *
     * See https://github.com/trufflesuite/truffle/tree/66e3b1cb10df881d80e2a22ddea68e9dcfbdcdb1/packages/truffle-contract-schema
     */
    static loadTruffleContract(contractName) {
        const contents = fs.readFileSync(`${__dirname}/../build/contracts/${contractName}.json`);
        const truffleJson = JSON.parse(contents);

        const constructorAbi = truffleJson.abi.find(n => n.type === 'constructor');

        return new Contract(truffleJson.contractName, truffleJson.bytecode, constructorAbi);
    }

    /**
     * Add a linked dependency to the contract.
     */
    addLinkedDependency(linkedContract) {
        this.linkReplacements.push(linkedContract);
    }

    /**
     * Returns the contract's address as detemined by the provided AddressGenerator.
     *
     * @param {Object} [addressGenerator] The AddressGenerator used for generating the addresses.
     *                                    Not required if an address has been provided in the
     *                                    constructor, or the address has been generated previously.
     * @returns {string} The contract's address.
     */
    generatedAddress(addressGenerator) {
        if (this.address) {
            return this.address;
        }
        if (!addressGenerator) {
            throw new Error(`addressGenerator not provided when generating address for ${this.contractName}`);
        }

        const address = addressGenerator.generate();
        this.address = address;
        return address;
    }

    /**
     * Performs all linking for a contract and returns the linked bytecode.
     * Assumes that the addresses of all linked dependencies have previously been set.
     *
     * @returns {string} The linked bytecode of the contract.
     */
    linkedBytecode() {
    // We can return the bytecode as-is if it doesn't require linking.
        if (this._checkFullyLinked()) {
            return this.contractBytecode;
        }

        const bytecode = this.contractBytecode;
        this.linkReplacements.forEach(
            (linkedContract) => {
                this.contractBytecode = this._linkBytecode(
                    linkedContract.contractName,
                    linkedContract.generatedAddress(),
                );
            },
        );

        if (!this._checkFullyLinked()) {
            throw new Error(
                `Contract ${this.contractName} has not been fully linked. This means that a link dependency has not been specified.`,
            );
        }

        return bytecode;
    }

    /*
     * Instantiate the contract by calculating the data of the contract creation transaction.
     * This includes encoding the provided constructor arguments.
     * Freezes the object to prevent any further changes.
     *
     * @param {Array.} [constructorArgs] The constructor arguments as expected by the
     *                                   constructor ABI.
     * @return {string} The transaction data for contract creation.
     */
    instantiate(constructorArgs) {
        if (this.constructorABI && !constructorArgs) {
            throw new Error(`Expected constructor arguments for constract ${this.contractName}`);
        }
        if (constructorArgs && !this.constructorABI) {
            throw new Error(`Provided arguments for contract ${this.contractName}, but no constructorAbi is set.`);
        }

        let constructorData = this.linkedBytecode();
        if (constructorArgs) {
            const web3 = new Web3();
            const encodedArguments = web3.eth.abi
                .encodeParameters(this.constructorABI.inputs, constructorArgs)
                .slice(2);
            constructorData += encodedArguments;
        }

        this.constructorData = constructorData;
        return constructorData;
    }

    /**
     * Replaces linking placeholder in this contract's bytecode with address.
     *
     * @param {string} contractName Name of the contract, as specified in the linking placeholder.
     * @param {string} contractAddress Address of the linked contract that will be used.
     * @return {string} The linked bytecode.
     */
    _linkBytecode(contractName, contractAddress) {
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
     * Add multiple contracts to the registry. See {@link ContractRegistry.addContract}.
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
     * @returns {object} The "accounts" section for a parity chainspec.
     */
    toParityGenesisAccounts() {
        // prepare contracts by ordering and generating addresses
        const addressGenerator = new IncrementingAddressGenerator();
        this._orderContracts();
        this.contracts.forEach(contract => contract.generatedAddress(addressGenerator));

        const output = {
        };

        Object.values(this.contracts)
            .forEach((contract) => {
                const address = contract.generatedAddress();
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
