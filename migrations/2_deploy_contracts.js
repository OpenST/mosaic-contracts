let MockMessageBus = artifacts.require("./gateway/MockMessageBus.sol"),
	MesssageBusTestWrapper = artifacts.require('./test/MessageBusTestWrapper'),
  MockMerklePatriciaProof = artifacts.require('./test/MockMerklePatriciaProof'),
	MerklePatriciaProofTest = artifacts.require('./MerklePatriciaProofTest'),
  MerklePatriciaProof = artifacts.require('./MerklePatriciaProof');

module.exports = function(deployer) {
  
  deployer.deploy(MockMerklePatriciaProof);
  deployer.link(MockMerklePatriciaProof,MockMessageBus);
  deployer.deploy(MockMessageBus);
  deployer.link(MockMessageBus,MesssageBusTestWrapper);
  
  // for merklepatricia unit test cases
	deployer.deploy(MerklePatriciaProof);
	deployer.link(MerklePatriciaProof,MerklePatriciaProofTest);

};


