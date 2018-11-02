const MessageBus = artifacts.require("./gateway/MessageBus.sol");
const GatewayLib = artifacts.require("./gateway/GatewayLib.sol");
const GatewayBase = artifacts.require("./gateway/GatewayBase.sol");
const Gateway = artifacts.require("Gateway");
const MockGatewayLib = artifacts.require("MockGatewayLib");
const MockGatewayBase = artifacts.require("MockGatewayBase");
const MetaBlock = artifacts.require("../contracts/lib/MetaBlock.sol");
const BlockStore = artifacts.require("../contracts/BlockStore.sol");
const MockEIP20Gateway = artifacts.require("MockEIP20Gateway");
const AuxiliaryBlockStore = artifacts.require(
  "../contracts/AuxiliaryBlockStore.sol"
);
const MockMessageBus = artifacts.require("./gateway/MockMessageBus.sol");
const	MessageBusWrapper = artifacts.require('./test/MessageBusWrapper');
const	MockMerklePatriciaProof = artifacts.require('./test/MockMerklePatriciaProof');
const	MerklePatriciaProofTest = artifacts.require('./MerklePatriciaProofTest');
const	MerklePatriciaProof = artifacts.require('./MerklePatriciaProof');
const	MockKernelGateway = artifacts.require('MockKernelGateway');
const	KernelGateway = artifacts.require('KernelGateway');

module.exports = function(deployer) {
	
	deployer.deploy(MerklePatriciaProof);

	deployer.link(MerklePatriciaProof, MessageBus);
	deployer.deploy(MessageBus);

	deployer.link(MerklePatriciaProof, [GatewayLib, KernelGateway, MockKernelGateway]);
	deployer.deploy(GatewayLib);
	deployer.deploy(MockGatewayLib);
	deployer.deploy(MetaBlock);
	deployer.link(GatewayLib, [GatewayBase, Gateway, MockEIP20Gateway]);
	deployer.link(MessageBus, [Gateway, MockEIP20Gateway]);
	deployer.link(MockGatewayLib, [MockGatewayBase, MockEIP20Gateway]);
	deployer.link(MetaBlock, [BlockStore, AuxiliaryBlockStore]);
	
	deployer.deploy(MockMerklePatriciaProof);
	deployer.link(MockMerklePatriciaProof,[MockMessageBus]);
	deployer.deploy(MockMessageBus);
	deployer.link(MockMessageBus,MessageBusWrapper);

	// for merklepatricia unit test cases
	deployer.link(MerklePatriciaProof,MerklePatriciaProofTest);

};

