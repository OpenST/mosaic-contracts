// This script is expected to be called via truffle exec
const ContractRegistry = require('./deployment_tools.js').ContractRegistry;
const loadTruffleContract = require('./deployment_tools.js').loadTruffleContract;

const registry = new ContractRegistry();

const EIP20Token = loadTruffleContract('EIP20Token');
registry.addTruffleContract(EIP20Token);
registry.addInstance(EIP20Token.contractName, 'MyEIP20', ['MYT', 'MyToken', 18], {
  address: '0x0000000000444440000000000000000000000100'
});

console.log(JSON.stringify(registry.toParityGenesisAccounts(), null, 4));
