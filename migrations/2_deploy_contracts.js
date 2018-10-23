const MessageBus = artifacts.require("./gateway/MessageBus.sol");
const GatewayLib = artifacts.require("./gateway/GatewayLib.sol");
const GatewayBase = artifacts.require("./gateway/GatewayBase.sol");
const Gateway = artifacts.require("Gateway");
const MockGatewayLib = artifacts.require("MockGatewayLib");
const MockGatewayBase = artifacts.require("MockGatewayBase");
const MetaBlock = artifacts.require("../contracts/lib/MetaBlock.sol");
const BlockStore = artifacts.require("../contracts/BlockStore.sol");
const MockMessageBus = artifacts.require("./gateway/MockMessageBus.sol");
const	MessageBusWrapper = artifacts.require('./test/MessageBusWrapper');
const	MockMerklePatriciaProof = artifacts.require('./test/MockMerklePatriciaProof');
const	MerklePatriciaProofTest = artifacts.require('./MerklePatriciaProofTest');
const	MerklePatriciaProof = artifacts.require('./MerklePatriciaProof');
const ProofLib = artifacts.require('./ProofLib');
const ProofLibTest = artifacts.require('./ProofLibTest.sol');

module.exports = function(deployer) {
	
	deployer.deploy(MerklePatriciaProof);
	deployer.link(MerklePatriciaProof, ProofLib);
	deployer.deploy(ProofLib);
	deployer.link(ProofLib, ProofLibTest);
	deployer.link(MerklePatriciaProof, ProofLibTest);
	deployer.deploy(ProofLibTest);
	
	// deployer.link(MerklePatriciaProof, MessageBus);
	// deployer.deploy(MessageBus);
	// deployer.link(MerklePatriciaProof, GatewayLib);
	// deployer.deploy(GatewayLib);
	// deployer.deploy(MockGatewayLib);
	// deployer.link(GatewayLib, [GatewayBase, Gateway]);
	// deployer.link(MessageBus, [Gateway]);
	// deployer.link(MockGatewayLib, [MockGatewayBase]);
	// deployer.deploy(MetaBlock);
	// deployer.link(MetaBlock, BlockStore);
	//
	//
	// deployer.deploy(MockMerklePatriciaProof);
	// deployer.link(MockMerklePatriciaProof,MockMessageBus);
	// deployer.deploy(MockMessageBus);
	// deployer.link(MockMessageBus,MessageBusWrapper);
	//
	// // for merklepatricia unit test cases
	// // deployer.deploy(MerklePatriciaProof);
	// deployer.link(MerklePatriciaProof,MerklePatriciaProofTest);
	//
};


