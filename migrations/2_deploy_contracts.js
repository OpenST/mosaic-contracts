let MessageBus = artifacts.require("./gateway/MessageBus.sol"),
TestMessageBus = artifacts.require("./gateway/TestMessageBus.sol"),
MerklePatriciaProof = artifacts.require('./test/MerklePatriciaProof'),
Assert = artifacts.require("./Assert.sol");
console.log("")
module.exports = function(deployer) {
  deployer.deploy(MerklePatriciaProof);
  deployer.link(MerklePatriciaProof,MessageBus);
  deployer.deploy(MessageBus);
  deployer.deploy(Assert);
  deployer.link(MessageBus, [TestMessageBus]);
  deployer.link(Assert, [TestMessageBus]);
  deployer.deploy(TestMessageBus);
};


