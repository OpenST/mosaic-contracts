// This script is expected to be called via truffle exec
const ContractRegistry = require('./deployment_tools.js').ContractRegistry;

module.exports = function(callback) {
  global.artifacts = artifacts;
  const migrate = require('../migrations/2_deploy_contracts.js');

  const registry = new ContractRegistry();

  migrate(registry.truffleDeployer());
  console.log(JSON.stringify(registry.toParityGenesisAccounts(), null, 4));
  callback();
};
