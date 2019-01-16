const Web3 = require('web3');
const colors = require('colors/safe');

const { Contract, ContractRegistry } = require('../deployment_tool');
const { deployContracts } = require('./helpers');

// root directory of npm project
const rootDir = `${__dirname}/../../`;

/** Returns the provided address as-is or or deploy a new EIP20Token and return its
 * address if the provided address is the special string "new".
 */
const tryDeployNewToken = async (rpcEndpoint, deployerAddress, eip20Address, deployOptions) => {
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
    const contracts = await deployContracts(web3, web3, deploymentObjects, deployOptions);
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

const createCommonContracts = (organizationOwner, remoteChainId, remoteBlockHeight, remoteStateRoot) => {
    const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
    const GatewayLib = Contract.loadTruffleContract('GatewayLib', null, { rootDir });
    GatewayLib.addLinkedDependency(MerklePatriciaProof);
    const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
    MessageBus.addLinkedDependency(MerklePatriciaProof);

    const Organization = Contract.loadTruffleContract('Organization', [
        organizationOwner, // TODO
        organizationOwner, // TODO
        [], // TODO
        '100000000000', // TODO
    ], { rootDir });
    const Anchor = Contract.loadTruffleContract(
        'Anchor',
        [
            remoteChainId,
            remoteBlockHeight,
            remoteStateRoot,
            10, // TODO: maxStateroots
            Organization.reference(),
        ],
        { rootDir },
    );

    return {
        MerklePatriciaProof,
        GatewayLib,
        MessageBus,
        Organization,
        Anchor,
    };
};

// tokenAddress = Branded Token
// baseTokenAddress = OST
const deployAnchorAndGateway = async (
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
        Anchor,
    } = createCommonContracts(
        deployerAddress, // TODO: organization owner
        chainIdAuxiliary,
        blockHeightAuxiliary,
        stateRootAuxiliary,
    );

    const EIP20Gateway = Contract.loadTruffleContract(
        'EIP20Gateway',
        [
            tokenAddress,
            baseTokenAddress,
            Anchor.reference(),
            bounty,
            Organization.reference(),
            '0x0000000000000000000000000000000000000000', // TODO: burner address
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
        Anchor,
    ]);

    const deploymentObjects = registry.toLiveTransactionObjects(deployerAddress, startingNonce);
    return deployContracts(web3, web3,  deploymentObjects);
};

// deploy for Auxiliary
const deployAnchorAndCoGateway = async (
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
        Anchor,
    } = createCommonContracts(
        deployerAddress, // TODO: organization owner
        chainIdOrigin,
        blockHeightOrigin,
        stateRootOrigin,
    );

    const OSTPrime = Contract.loadTruffleContract(
        'OSTPrime',
        [
            tokenAddressOrigin,
            Organization.reference(),
        ],
        { rootDir },
    );

    const EIP20CoGateway = Contract.loadTruffleContract(
        'EIP20CoGateway',
        [
            tokenAddressOrigin,
            OSTPrime.reference(),
            Anchor.reference(),
            bounty,
            Organization.reference(),
            gatewayAddress,
            '0x0000000000000000000000000000000000000000', // TODO: burner address
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
        Anchor,
    ]);

    const deploymentObjects = registry.toLiveTransactionObjects(deployerAddress, startingNonce);
    return deployContracts(web3, web3, deploymentObjects);
};

module.exports = {
    tryDeployNewToken,
    checkEip20Address,
    getChainInfo,
    deployAnchorAndGateway,
    deployAnchorAndCoGateway,
};
