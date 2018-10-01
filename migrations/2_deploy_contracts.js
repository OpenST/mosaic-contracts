let MessageBus = artifacts.require("./gateway/MessageBus.sol");

module.exports = function(deployer) {
  deployer.deploy(MessageBus);
};


