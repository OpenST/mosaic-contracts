let MessageBus = artifacts.require("./gateway/MessageBus.sol"),
TestMessageBus = artifacts.require("./gateway/TestMessageBus.sol"),
Assert = artifacts.require("./Assert.sol");

module.exports = function(deployer) {
  deployer.deploy(MessageBus);
  deployer.deploy(Assert);
  deployer.link(MessageBus, [TestMessageBus]);
  deployer.link(Assert, [TestMessageBus]);
  deployer.deploy(TestMessageBus);
};


