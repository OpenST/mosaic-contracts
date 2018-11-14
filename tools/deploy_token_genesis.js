// This script is expected to be called via truffle exec
const ContractRegistry = require('./deployment_tools.js').ContractRegistry;
module.exports = function(callback) {
  const registry = new ContractRegistry();

  const EIP20Token = artifacts.require("./gateway/EIP20Token.sol");
  registry.addContract(
    EIP20Token.contractName,
    EIP20Token.bytecode,
    { constructorAbi: EIP20Token.abi.find(n => n.type === 'constructor').inputs }
  );
  registry.addInstance(EIP20Token.contractName, 'MyEIP20', ['MYT', 'MyToken', 18]);

  console.log(JSON.stringify(registry.toParityGenesisAccounts(), null, 4));
  callback();
};
