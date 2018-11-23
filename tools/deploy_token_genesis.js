// Demonstrates a genesis deployment of a EIP20Token
const Contract = require('./deployment_tools.js').Contract;
const ContractRegistry = require('./deployment_tools.js').ContractRegistry;

const EIP20Token = Contract.loadTruffleContract('EIP20Token');
EIP20Token.address = '0x0000000000444440000000000000000000000100';
EIP20Token.instantiate(['MYT', 'MyToken', 18]);

const registry = new ContractRegistry();
registry.addContract(EIP20Token);

console.log(JSON.stringify(registry.toParityGenesisAccounts(), null, 4));
