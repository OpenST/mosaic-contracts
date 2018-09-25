let MessageBus = artifacts.require("./gateway/MessageBus.sol"),
    TestMessageBus = artifacts.require("./gateway/TestMessageBus.sol"),
    Assert = artifacts.require("./Assert.sol"),
    Gateway = artifacts.require("Gateway");

module.exports = function(deployer) {
    deployer.deploy(MessageBus);
    deployer.deploy(Assert);
    deployer.link(MessageBus, [TestMessageBus, Gateway]);
    deployer.link(Assert, [TestMessageBus]);
    deployer.deploy(TestMessageBus);
};


