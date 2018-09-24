let MetaBlock = artifacts.require("../contracts/lib/MetaBlock.sol");
let BlockStore = artifacts.require("../contracts/BlockStore.sol");

module.exports = function(deployer) {
  deployer.deploy(MetaBlock);
  deployer.link(MetaBlock, BlockStore);
};
