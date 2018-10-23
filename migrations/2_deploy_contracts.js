const MessageBus = artifacts.require("./gateway/MessageBus.sol");
const GatewayLib = artifacts.require("./gateway/GatewayLib.sol");
const GatewayBase = artifacts.require("./gateway/GatewayBase.sol");
const Gateway = artifacts.require("Gateway");
const MockGatewayLib = artifacts.require("MockGatewayLib");
const MockGatewayBase = artifacts.require("MockGatewayBase");
const MetaBlock = artifacts.require("../contracts/lib/MetaBlock.sol");
const BlockStore = artifacts.require("../contracts/BlockStore.sol");
const MockMessageBus = artifacts.require("./gateway/MockMessageBus.sol");
const	MesssageBusTestWrapper = artifacts.require('./test/MessageBusWrapper');
const	MockMerklePatriciaProof = artifacts.require('./test/MockMerklePatriciaProof');
const	MerklePatriciaProofTest = artifacts.require('./MerklePatriciaProofTest');
const	MerklePatriciaProof = artifacts.require('./MerklePatriciaProof');




module.exports = function(deployer) {
	deployer.deploy(MessageBus);
	deployer.deploy(GatewayLib);
	deployer.deploy(MockGatewayLib);
	deployer.link(GatewayLib, [GatewayBase, Gateway]);
	deployer.link(MessageBus, [Gateway]);
	deployer.link(MockGatewayLib, [MockGatewayBase]);
	deployer.deploy(MetaBlock);
	deployer.link(MetaBlock, BlockStore);
	
	
	deployer.deploy(MockMerklePatriciaProof);
	deployer.link(MockMerklePatriciaProof,MockMessageBus);
	deployer.deploy(MockMessageBus);
	deployer.link(MockMessageBus,MesssageBusTestWrapper);
	
	// for merklepatricia unit test cases
	deployer.deploy(MerklePatriciaProof);
	deployer.link(MerklePatriciaProof,MerklePatriciaProofTest);
	
	
	
};


