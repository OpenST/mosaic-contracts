let MessageBus = artifacts.require("./gateway/MessageBus.sol"),
    GatewayLib = artifacts.require("./gateway/GatewayLib.sol"),
    Gateway = artifacts.require("Gateway");

module.exports = function(deployer) {
    deployer.deploy(MessageBus);
    deployer.deploy(GatewayLib);
    deployer.link(GatewayLib, [Gateway]);
    deployer.link(MessageBus, [Gateway]);
};


