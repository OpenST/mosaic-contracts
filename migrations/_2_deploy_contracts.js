var messageBus = artifacts.require('./MessageBus.sol');
var messageBusTest = artifacts.require('./MessageBusTest.sol');

module.exports = function(deployer) {
   
   deployer.deploy(messageBus);
   deployer.link(messageBus, messageBusTest);
   deployer.deploy(messageBusTest,{gas: 1000000});

};
