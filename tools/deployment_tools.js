const web3 = require('web3');

// A contract registry that allows for registering contracts, linkages between them.
// It also handles multiple instantiation of the contracts (with constructor arguments).
// As a output it can produce the "accounts" field of a parity chainspec.
//
// The main functions of interest for users are:
//   - `.addContract()` / `.addTruffleContract()`
//   - `.link()`
//   - `.addInstance()`
//   - `.toParityGenesisAccounts()`
class ContractRegistry {
  constructor() {
    this.startAddress = '0x0000000000000000000000000000000000000100';
    this.nextAvailableAddress = this.startAddress;
    this.contracts = {};
    this.instances = [];

    this.addContract = this.addContract.bind(this);
    this.addInstance = this.addInstance.bind(this);
    this.addTruffleContract = this.addTruffleContract.bind(this);
    this.checkFullyLinked = this.checkFullyLinked.bind(this);
    this.link = this.link.bind(this);
    this.linkBytecode = this.linkBytecode.bind(this);
    this.linkedBytecodeForContract = this.linkedBytecodeForContract.bind(this);
    this.takeNextAddress = this.takeNextAddress.bind(this);
    this.toParityGenesisAccounts = this.toParityGenesisAccounts.bind(this);
    this.truffleDeployer = this.truffleDeployer.bind(this);
  }

  // Used for automatic address distribution (which we can do for a genesis deployment).
  takeNextAddress() {
    const addressHex = this.nextAvailableAddress;
    const nextAddressBN = web3.utils.toBN(addressHex).add(web3.utils.toBN('1'));
    this.nextAvailableAddress = '0x' + web3.utils.padLeft(nextAddressBN, 40);
    return addressHex;
  }

  // Add a contract to the registry.
  //
  // `options.deploy` determines if a contract should be designated for deployment or not.
  // It should be set to `true` for contracts where only a single instance is required without constructor arguments (e.g. libraries).
  // For contracts with possibly multiple instances, it should be set to `false` (default) and then intantiated via `.instantiate()`
  addContract(contractName, contractBytecode, options = { deploy: false }) {
    const addressHex = this.takeNextAddress();
    this.contracts[contractName] = Object.assign(
      {
        linkReplacements: [],
      },
      this.contracts[contractName], // We might have set linkReplacements before
      {
        address: addressHex,
        bytecode: contractBytecode,
        deploy: options.deploy,
        constructorAbi: options.constructorAbi
      },
    );
  }

  // Mark a library for linking into a contract.
  //
  // This doesn't actually perform the linking on the bytecode, which is done at a later point.
  // This is done either during `.toParityGenesisAccounts()` for singleton contracts or when instantiating a contract via `.addInstance()`.
  link(libraryContractName, consumingContractName) {
    const libraryContractAddress = this.contracts[libraryContractName]
      .address;
    if (!libraryContractAddress) {
      throw new Error(`Could not find address for library ${libraryContractName}.`)
    }

    if (!this.contracts[consumingContractName]) {
      this.contracts[consumingContractName] = {};
    }
    if (!this.contracts[consumingContractName].linkReplacements) {
      this.contracts[consumingContractName].linkReplacements = [];
    }
    this.contracts[consumingContractName].linkReplacements.push([
      libraryContractName,
      libraryContractAddress,
    ]);
  }

  // Performs all linking for a contract and returns the linked bytecode.
  linkedBytecodeForContract(contractName) {
    if (!this.contracts[contractName]) {
      throw new Error(`Unknown contract name ${contractName}`);
    }

    let bytecode = this.contracts[contractName].bytecode;
    this.contracts[contractName].linkReplacements.forEach(
      ([libraryName, libraryAddress]) => {
        bytecode = this.linkBytecode(
          bytecode,
          libraryAddress,
          libraryName,
        );
      },
    );

    return bytecode;
  }

  // Instantiate a contract with the provided constructor arguments.
  //
  // This is useful when multiple instances of a contract are required, and currently also the only way to deploy a contract that expects constructor arguments.
  addInstance(contractName, instanceName, instanceArguments) {
    if (!this.contracts[contractName]) {
      throw new Error(`Unknown contract name ${contractName}`);
    }
    const contract = this.contracts[contractName];
    const bytecode = this.linkedBytecodeForContract(contractName);
    if (!this.checkFullyLinked(bytecode)) {
      throw new Error(
        `Contract ${contractName} can't be deployed as it is not fully linked`,
      );
    }

    this.instances.push({
      bytecode,
      name: instanceName,
      arguments: instanceArguments,
      constructorAbi: contract.constructorAbi,
      address: this.takeNextAddress(),
    });
  }

  // Replaces linking placeholder in bytecode with address.
  linkBytecode(bytecode, libraryAddress, libraryName) {
    let pattern = '__' + libraryName + '______________________________________';
    pattern = pattern.slice(0, 40);
    let address = libraryAddress.replace('0x', '');

    return bytecode.replace(new RegExp(pattern, 'g'), address);
  }

  // Checks if the provided bytecode is fully linked (= it containsn no linking placeholders).
  checkFullyLinked(bytecode) {
    if (!bytecode) {
      return false;
    }
    return !bytecode.includes('_');
  }


  // Generate the "accounts" object for a parity chainspec for all the contracts and instances that have been designated for deployment.
  //
  // For that it uses the { "0x...": { "constructor": "0x..." } } version of account intialization which is currently exclusive to parity.
  toParityGenesisAccounts() {
    let output = {
    };

    Object.values(this.contracts)
      .filter(n => this.checkFullyLinked(n.bytecode))
      .filter(n => n.deploy)
      .forEach(contract => {
        output[contract.address] = {
          balance: '0',
          constructor: contract.bytecode,
        };
      });
    this.instances
      .forEach(instance => {
        let constructorWithArguments = instance.bytecode;
        if (instance.arguments || instance.constructorAbi) {
          if (!instance.arguments) {
            throw new Error(`Expected arguments for instance ${instance.name}`);
          }
          if (!instance.constructorAbi) {
            throw new Error(`Provided arguments for instance ${instance.name}, but no constructorAbi is set.`);
          }
          const Web3 = new web3();
          let encodedArguments = Web3.eth.abi.encodeParameters(instance.constructorAbi, instance.arguments).slice(2);
          constructorWithArguments = constructorWithArguments + encodedArguments;
        }
        output[instance.address] = {
          balance: '0',
          constructor: constructorWithArguments,
        };
      });

    return output;
  }

  // Returns an object that has a similar interface to a truffle deployer, for creating a genesis file from a truffle migration script.
  truffleDeployer() {
    const deployer = {
      deploy: contract => {
        this.addContract(contract.contractName, contract.bytecode);
      },
      link: (library, destinations) => {
        const dests = web3.utils._.flatten([destinations]);
        dests.forEach(destination => {
          this.link(library.contractName, destination.contractName);
        });
      },
    };

    return deployer;
  }

  // Helper for `.addContract` that allows for easier adding of object that follow the truffle-contract-schema.
  //
  // See: https://github.com/trufflesuite/truffle/tree/66e3b1cb10df881d80e2a22ddea68e9dcfbdcdb1/packages/truffle-contract-schema
  addTruffleContract(truffleContract, options = {}) {
    const inferredOptions = {};
    const constructorAbi = truffleContract.abi.find(n => n.type === 'constructor');
    if (constructorAbi) {
      inferredOptions.constructorAbi = constructorAbi.inputs;
    }
    this.addContract(truffleContract.contractName, truffleContract.bytecode, Object.assign(inferredOptions, options));
  }
}

const loadTruffleContract = (contractName) => {
  const fs = require('fs');
  const contents = fs.readFileSync(`${__dirname}/../build/contracts/${contractName}.json`);
  return JSON.parse(contents);
}

module.exports = {
  ContractRegistry,
  loadTruffleContract,
};
