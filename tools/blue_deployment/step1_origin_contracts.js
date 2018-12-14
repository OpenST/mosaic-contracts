const Web3 = require('web3');
const inquirer = require('inquirer');
const colors = require('colors/safe');

const { Contract, ContractRegistry } = require('../deployment_tool');
const { deployContracts } = require('./helpers');
const {
    inquireDeployerAddressAuxiliary,
    inquireDeployerAddressOrigin,
    inquireEIP20TokenAddress,
    inquireEIP20BaseTokenAddress,
    inquireRpcEndpointAuxiliary,
    inquireRpcEndpointOrigin,
} = require('./prompts');

// root directory of npm project
const rootDir = `${__dirname}/../../`;

const tryDeployNewToken = async (rpcEndpoint, deployerAddress, eip20Address) => {
    if (eip20Address !== 'new') {
        return eip20Address;
    }

    const web3 = new Web3(rpcEndpoint);
    const startingNonce = await web3.eth.getTransactionCount(deployerAddress);

    const EIP20Token = Contract.loadTruffleContract(
        'EIP20Token',
        ['MYT', 'MyToken', 18],
        { rootDir },
    );

    const registry = new ContractRegistry();
    registry.addContract(EIP20Token);

    const deploymentObjects = registry.toLiveTransactionObjects(deployerAddress, startingNonce);
    const contracts = await deployContracts(web3, deploymentObjects);
    return contracts.EIP20Token;
};

const checkEip20Address = async (rpcEndpoint, eip20Address) => {
    const web3 = new Web3(rpcEndpoint);

    const contractCode = await web3.eth.getCode(eip20Address);
    if (!contractCode) {
        console.warn(colors.red('There is no contract present at the specified address!'));
    }
};

const getChainInfo = async (rpcEndpoint) => {
    const web3 = new Web3(rpcEndpoint);

    const chainId = await web3.eth.net.getId();
    const block = await web3.eth.getBlock('latest');

    return {
        chainId,
        blockHeight: block.number,
        stateRoot: block.stateRoot,
    };
};

const createCommonContracts = (remoteChainId, remoteBlockHeight, remoteStateRoot) => {
    const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
    const GatewayLib = Contract.loadTruffleContract('GatewayLib', null, { rootDir });
    GatewayLib.addLinkedDependency(MerklePatriciaProof);
    const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
    MessageBus.addLinkedDependency(MerklePatriciaProof);

    const Organization = Contract.loadTruffleContract('Organization', [], { rootDir });
    const SafeCore = Contract.loadTruffleContract(
        'SafeCore',
        [
            remoteChainId,
            remoteBlockHeight,
            remoteStateRoot,
            Organization.reference(),
        ],
        { rootDir },
    );

    return {
        MerklePatriciaProof,
        GatewayLib,
        MessageBus,
        Organization,
        SafeCore,
    };
};

// tokenAddress = Branded Token
// baseTokenAddress = OST
const deploySafeCoreAndGateway = async (
    rpcEndpointOrigin,
    deployerAddress,
    tokenAddress,
    baseTokenAddress,
    bounty,
    chainIdAuxiliary,
    blockHeightAuxiliary,
    stateRootAuxiliary,
) => {
    const web3 = new Web3(rpcEndpointOrigin);
    const startingNonce = await web3.eth.getTransactionCount(deployerAddress);

    const {
        MerklePatriciaProof,
        GatewayLib,
        MessageBus,
        Organization,
        SafeCore,
    } = createCommonContracts(chainIdAuxiliary, blockHeightAuxiliary, stateRootAuxiliary);

    const EIP20Gateway = Contract.loadTruffleContract(
        'EIP20Gateway',
        [
            tokenAddress,
            baseTokenAddress,
            SafeCore.reference(),
            bounty,
            Organization.reference(),
        ],
        { rootDir },
    );
    EIP20Gateway.addLinkedDependency(GatewayLib);
    EIP20Gateway.addLinkedDependency(MessageBus);

    const registry = new ContractRegistry();
    registry.addContracts([
        EIP20Gateway,
        GatewayLib,
        MerklePatriciaProof,
        MessageBus,
        Organization,
        SafeCore,
    ]);

    const deploymentObjects = registry.toLiveTransactionObjects(deployerAddress, startingNonce);
    return await deployContracts(web3, deploymentObjects);
};

// deploy for Auxiliary
const deploySafeCoreAndCoGateway = async (
    rpcEndpointAuxiliary,
    deployerAddress,
    tokenAddressOrigin,
    gatewayAddress,
    bounty,
    chainIdOrigin,
    blockHeightOrigin,
    stateRootOrigin,
) => {
    const web3 = new Web3(rpcEndpointAuxiliary);
    const startingNonce = await web3.eth.getTransactionCount(deployerAddress);

    const {
        MerklePatriciaProof,
        GatewayLib,
        MessageBus,
        Organization,
        SafeCore,
    } = createCommonContracts(chainIdOrigin, blockHeightOrigin, stateRootOrigin);

    const OSTPrime = Contract.loadTruffleContract(
        'OSTPrime',
        [
            tokenAddressOrigin,
        ],
        { rootDir },
    );

    const EIP20CoGateway = Contract.loadTruffleContract(
        'EIP20CoGateway',
        [
            tokenAddressOrigin,
            OSTPrime.reference(),
            SafeCore.reference(),
            bounty,
            Organization.reference(),
            gatewayAddress,
        ],
        { rootDir },
    );
    EIP20CoGateway.addLinkedDependency(GatewayLib);
    EIP20CoGateway.addLinkedDependency(MessageBus);

    const registry = new ContractRegistry();
    registry.addContracts([
        EIP20CoGateway,
        OSTPrime,
        GatewayLib,
        MerklePatriciaProof,
        MessageBus,
        Organization,
        SafeCore,
    ]);

    const deploymentObjects = registry.toLiveTransactionObjects(deployerAddress, startingNonce);
    await deployContracts(web3, deploymentObjects);
};

const printSign = (text) => {
    const mainLine = '===== ' + text + ' =====';
    const delimiter = '='.repeat(mainLine.length);

    console.log();
    console.log(colors.yellow(delimiter));
    console.log(colors.yellow(mainLine));
    console.log(colors.yellow(delimiter));
    console.log();
};

const main = async () => {
    printSign('QUESTIONS ORIGIN');
    const rpcEndpointOrigin = await inquireRpcEndpointOrigin();
    const deployerAddressOrigin = await inquireDeployerAddressOrigin(rpcEndpointOrigin);

    let tokenAddressOrigin = await inquireEIP20TokenAddress(rpcEndpointOrigin);
    tokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, tokenAddressOrigin);
    checkEip20Address(rpcEndpointOrigin, tokenAddressOrigin);

    let baseTokenAddressOrigin = await inquireEIP20BaseTokenAddress(rpcEndpointOrigin);
    baseTokenAddressOrigin = await tryDeployNewToken(rpcEndpointOrigin, deployerAddressOrigin, tokenAddressOrigin);
    checkEip20Address(rpcEndpointOrigin, baseTokenAddressOrigin);

    printSign('QUESTIONS AUXILIARY');
    const rpcEndpointAuxiliary = await inquireRpcEndpointAuxiliary();
    const deployerAddressAuxiliary = await inquireDeployerAddressAuxiliary(rpcEndpointAuxiliary);

    const bountyOrigin = '0x01'; // TODO
    const bountyAuxiliary = '0x01'; // TODO

    const originInfo = await getChainInfo(rpcEndpointOrigin);
    const auxiliaryInfo = await getChainInfo(rpcEndpointAuxiliary);

    printSign('DEPLOYING ORIGIN');
    const originAddresses = await deploySafeCoreAndGateway(
        rpcEndpointOrigin,
        deployerAddressOrigin,
        tokenAddressOrigin,
        baseTokenAddressOrigin,
        bountyOrigin,
        auxiliaryInfo.chainId,
        auxiliaryInfo.blockHeight,
        auxiliaryInfo.stateRoot,
    );

    printSign('DEPLOYING AUXILIARY');
    const gatewayAddressOrigin = originAddresses.EIP20Gateway;
    await deploySafeCoreAndCoGateway(
        rpcEndpointAuxiliary,
        deployerAddressAuxiliary,
        tokenAddressOrigin,
        gatewayAddressOrigin,
        bountyAuxiliary,
        originInfo.chainId,
        originInfo.blockHeight,
        originInfo.stateRoot,
    );
};

main();
