let MessageBus = artifacts.require("./gateway/MessageBus.sol");
let GatewayLib = artifacts.require("./gateway/GatewayLib.sol");
let Gateway = artifacts.require("Gateway");
let MetaBlock = artifacts.require("../contracts/lib/MetaBlock.sol");
let BlockStore = artifacts.require("../contracts/BlockStore.sol");
let AuxiliaryBlockStore = artifacts.require(
  "../contracts/AuxiliaryBlockStore.sol"
);

module.exports = function(deployer) {
  deployer.deploy(MessageBus);
  deployer.deploy(GatewayLib);
  deployer.link(GatewayLib, [Gateway]);
  deployer.link(MessageBus, [Gateway]);

  deployer.deploy(MetaBlock);
  deployer.link(MetaBlock, BlockStore);
  deployer.link(MetaBlock, AuxiliaryBlockStore);
};
