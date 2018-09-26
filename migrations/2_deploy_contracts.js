let MockMessageBus = artifacts.require("./gateway/MockMessageBus.sol"),
MockMessage
TestMessageBus = artifacts.require("./gateway/TestMessageBus.sol"),
MockMerklePatriciaProof = artifacts.require('./test/MockMerklePatriciaProof'),
MesssageBusTestWrapper = artifacts.require('./test/MessageBusTestWrapper'),
MerklePatriciaProofTest = artifacts.require('./MerklePatriciaProofTest'),
MerklePatriciaProof = artifacts.require('./MerklePatriciaProof');
Assert = artifacts.require("./Assert.sol");

module.exports = function(deployer) {
  console.log("Before");
  deployer.deploy(MockMerklePatriciaProof);
  deployer.link(MockMerklePatriciaProof,MockMessageBus);
  deployer.deploy(MockMessageBus);
  deployer.deploy(Assert);
  deployer.link(MockMessageBus, [TestMessageBus]);
  deployer.link(Assert, [TestMessageBus]);
  deployer.deploy(TestMessageBus);
	
	deployer.link(MockMessageBus, MesssageBusTestWrapper);
	
	//For MerklePatricia unit test cases
  deployer.deploy(MerklePatriciaProof);
	deployer.link(MerklePatriciaProof,MerklePatriciaProofTest);
	deployer.deploy(MerklePatriciaProofTest);
	console.log("Afterrrrrrr");
	
};


