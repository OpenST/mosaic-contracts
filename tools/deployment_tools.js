const web3 = require('web3');

class ContractRegistry {
  constructor() {
    this.startAddress = '0x0000000000000000000000000000000000000100';
    this.nextAvailableAddress = web3.utils.hexToBytes(this.startAddress);
    this.contracts = {};
    this.instances = [];

    this.addContract = this.addContract.bind(this);
    this.addInstance = this.addInstance.bind(this);
    this.checkFullyLinked = this.checkFullyLinked.bind(this);
    this.link = this.link.bind(this);
    this.linkBytecode = this.linkBytecode.bind(this);
    this.linkedBytecodeForContract = this.linkedBytecodeForContract.bind(this);
    this.truffleDeployer = this.truffleDeployer.bind(this);
    this.toParityGenesisAccounts = this.toParityGenesisAccounts.bind(this);
    this.takeNextAddress = this.takeNextAddress.bind(this);
  }

  takeNextAddress() {
    const addressHex = web3.utils.bytesToHex(this.nextAvailableAddress);
    this.nextAvailableAddress[this.nextAvailableAddress.length - 1] += 1;
    return addressHex;
  }

  // Add a contract to the registry
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

  // replaces placeholder in bytecode with address
  linkBytecode(bytecode, libraryAddress, libraryName) {
    let pattern = '__' + libraryName + '______________________________________';
    pattern = pattern.slice(0, 40);
    let address = libraryAddress.replace('0x', '');

    return bytecode.replace(new RegExp(pattern, 'g'), address);
  }

  checkFullyLinked(bytecode) {
    if (!bytecode) {
      return false;
    }
    return !bytecode.includes('_');
  }


  toParityGenesisAccounts() {
    let output = {
      accounts: {},
    };

    Object.values(this.contracts)
      .filter(n => this.checkFullyLinked(n.bytecode))
      .filter(n => n.deploy)
      .forEach(contract => {
        output.accounts[contract.address] = {
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
        output.accounts[instance.address] = {
          balance: '0',
          constructor: constructorWithArguments,
        };
      });

    return output;
  }

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
}

module.exports = {
  ContractRegistry
};
