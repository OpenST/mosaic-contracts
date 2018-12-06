const MessageBus = artifacts.require("./gateway/MessageBus.sol");
const GatewayLib = artifacts.require("./gateway/GatewayLib.sol");
const GatewayBase = artifacts.require("./gateway/GatewayBase.sol");
const EIP20Gateway = artifacts.require("EIP20Gateway");
const MockGatewayLib = artifacts.require("MockGatewayLib");
const MockGatewayBase = artifacts.require("MockGatewayBase");
const MetaBlock = artifacts.require("../contracts/lib/MetaBlock.sol");
const BlockStore = artifacts.require("../contracts/BlockStore.sol");
const TestEIP20Gateway = artifacts.require("TestEIP20Gateway");
const EIP20CoGateway = artifacts.require("EIP20CoGateway");
const AuxiliaryBlockStore = artifacts.require(
    "../contracts/AuxiliaryBlockStore.sol"
);
const MockMessageBus = artifacts.require("./gateway/MockMessageBus.sol");
const MessageBusWrapper = artifacts.require('./test/MessageBusWrapper');
const MockMerklePatriciaProof = artifacts.require('./test/MockMerklePatriciaProof');
const MerklePatriciaProofTest = artifacts.require('./MerklePatriciaProofTest');
const MerklePatriciaProof = artifacts.require('./MerklePatriciaProof');
const TestKernelGateway = artifacts.require('TestKernelGateway');
const TestKernelGatewayFail = artifacts.require('TestKernelGatewayFail');
const KernelGateway = artifacts.require('KernelGateway');


const MockMerklePatriciaProofFail = artifacts.require("MockMerklePatriciaProofFail");
const MockMessageBusFail = artifacts.require("MockMessageBusFail");
const MessageBusWrapperFail = artifacts.require("MessageBusWrapperFail");



module.exports = function (deployer) {

    deployer.deploy(MerklePatriciaProof);

    deployer.link(MerklePatriciaProof, MessageBus);
    deployer.deploy(MessageBus);

    deployer.link(
        MerklePatriciaProof,
        [GatewayLib, KernelGateway, TestKernelGateway, TestKernelGatewayFail]
    );

    deployer.deploy(GatewayLib);
    deployer.deploy(MockGatewayLib);
    deployer.deploy(MetaBlock);
    deployer.link(GatewayLib, [GatewayBase, EIP20Gateway, TestEIP20Gateway, EIP20CoGateway]);
    deployer.link(MessageBus, [EIP20CoGateway,TestEIP20Gateway, EIP20Gateway]);
    deployer.link(MockGatewayLib, [MockGatewayBase, TestEIP20Gateway]);
    deployer.link(MetaBlock, [BlockStore, AuxiliaryBlockStore]);

    deployer.deploy(MockMerklePatriciaProof);
    deployer.link(MockMerklePatriciaProof, [MockMessageBus]);
    deployer.deploy(MockMessageBus);
    deployer.link(MockMessageBus, MessageBusWrapper);

    deployer.link(MerklePatriciaProof, MerklePatriciaProofTest);


    deployer.deploy(MockMerklePatriciaProofFail);
    deployer.link(MockMerklePatriciaProofFail, [MockMessageBusFail]);
    deployer.deploy(MockMessageBusFail);
    deployer.link(MockMessageBusFail, MessageBusWrapperFail);

};

