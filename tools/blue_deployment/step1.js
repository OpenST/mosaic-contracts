/**
 * @typedef {Object} ChainInfo
 * @property {string} chainId The chain id.
 * @property {string} blockHeight The height (= block number) of the the
 *                    most recent block of the chain.
 * @property {string} stateRoot The state root of the the most recent
 *                    block of the chain.
 */

/**
 * @typedef {Object} Contract
 */

/**
 * @typedef {Object} ContractReference
 */

/**
 * @typedef {string} Address
 */

const Web3 = require('web3');
const colors = require('colors/safe');

const {
    Contract,
    ContractRegistry,
    UnlockedWeb3Signer,
    deployContracts,
} = require('../deployment_tool');

// root directory of npm project
const rootDir = `${__dirname}/../../`;

/**
 * Returns the provided address as-is or or deploy a new EIP20Token and return its
 * address if the provided address is the special string "new".
 *
 * @param {string} rpcEndpoint RPC endpoint for the web3 instance to use.
 * @param {Address} deployerAddress Address of the account to use for deployment.
 * @param {Address|string} eip20Address Either an existing address of a EIP20Token,
 *                 or the special string "new".
 * @param {object} deployOptions See {@link deployContracts}.
 *
 * @returns {Address} The address of either the provided EIP20Token or the
 *                   newly deployed one.
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
    const contracts = await deployContracts(
        new UnlockedWeb3Signer(web3),
        web3,
        deploymentObjects,
        deployOptions,
    );
    return contracts.EIP20Token;
};

/**
 * Check if the provided address contains a EIP20Token.
 * For now only checks if the provided address contains code.
 */
const checkEip20Address = async (rpcEndpoint, eip20Address) => {
    const web3 = new Web3(rpcEndpoint);

    const contractCode = await web3.eth.getCode(eip20Address);
    if (!contractCode) {
        console.warn(colors.red('There is no contract present at the specified address!'));
    }
};

/**
 * Get information about the chain that is required for Gateway deployment.
 *
 * @returns {ChainInfo} The chain information of the most recent block on the chain.
 */
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

/**
 * Create Contract instances for libraries MerklePatriciaProof, GatewayLib, MessageBus.
 *
 * @returns {Object.<string, Contract>} Map from contract names to contract instances.
 */
const createLibraryConracts = () => {
    const MerklePatriciaProof = Contract.loadTruffleContract('MerklePatriciaProof', null, { rootDir });
    const GatewayLib = Contract.loadTruffleContract('GatewayLib', null, { rootDir });
    GatewayLib.addLinkedDependency(MerklePatriciaProof);
    const MessageBus = Contract.loadTruffleContract('MessageBus', null, { rootDir });
    MessageBus.addLinkedDependency(MerklePatriciaProof);

    return {
        MerklePatriciaProof,
        GatewayLib,
        MessageBus,
    };
};

/**
 * Create an Organization Contract
 *
 * @param {Address} adminAddress Address of the organization admin.
 * @param {Address} ownerAddress Address of the organization owner.
 * @param {Array.<Address>} workerAddresses Addresses of the organization workers.
 * @param {expirationHeight} expirationHeight Block height at which the
 *                           workers will expire.
 *
 * @returns {Contract} The Organization contract instance.
 */
const createOrganization = (adminAddress, ownerAddress, workerAddresses, expirationHeight) =>  {
    return Contract.loadTruffleContract('Organization', [
        adminAddress,
        ownerAddress,
        workerAddresses,
        expirationHeight,
    ], { rootDir });
};

/**
 * Create an Anchor Contract
 *
 * @param {Address|ContractReference} organization The address of or reference
 *                                    to the Organization contract for the anchor.
 * @param {string} remoteChainId The chain id of the remote chain to anchor.
 * @param {number} remoteBlockHeight The block height of the remote chain to anchor.
 * @param {string} remoteStateRoot The state root of the remote chain to anchor.
 * @param {number} maxStateroots The max number of state roots to store in
 *                               thecircular buffer.
 *
 * @returns {Contract} The Anchor contract instance.
 */
const createAnchor = (
    organization,
    remoteChainId,
    remoteBlockHeight,
    remoteStateRoot,
    maxStateroots = '10',
) => {
    return Contract.loadTruffleContract(
        'Anchor',
        [
            remoteChainId,
            remoteBlockHeight,
            remoteStateRoot,
            maxStateroots,
            organization,
        ],
        { rootDir },
    );
};

const createEIP20Gateway = (
    tokenAddress,
    baseTokenAddress,
    anchorAddress,
    bounty,
    organizationAddress,
    burnerAddress = '0x0000000000000000000000000000000000000000',
) => {
    return Contract.loadTruffleContract(
        'EIP20Gateway',
        [
            tokenAddress,
            baseTokenAddress,
            anchorAddress,
            bounty,
            organizationAddress,
            burnerAddress,
        ],
        { rootDir },
    );
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
    } = createLibraryConracts();
    const Organization = createOrganization(
        deployerAddress, // TODO
        deployerAddress, // TODO
        [deployerAddress], // TODO
        '100000000000', // TODO
    );
    const Anchor = createAnchor(
        Organization.reference(),
        chainIdAuxiliary,
        blockHeightAuxiliary,
        stateRootAuxiliary,
        '10', // TODO
    );

    const EIP20Gateway = createEIP20Gateway(
        tokenAddress,
        baseTokenAddress,
        Anchor.reference(),
        bounty,
        Organization.reference(),
        '0x0000000000000000000000000000000000000000', // TODO: burner address
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
    return deployContracts(
        new UnlockedWeb3Signer(web3),
        web3,
        deploymentObjects,
    );
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
    } = createLibraryConracts();
    const Organization = createOrganization(
        deployerAddress, // TODO
        deployerAddress, // TODO
        [deployerAddress], // TODO
        '100000000000', // TODO
    );
    const Anchor = createAnchor(
        Organization.reference(),
        chainIdOrigin,
        blockHeightOrigin,
        stateRootOrigin,
        '10', // TODO
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
    return deployContracts(
        new UnlockedWeb3Signer(web3),
        web3,
        deploymentObjects,
    );
};

module.exports = {
    tryDeployNewToken,
    checkEip20Address,
    getChainInfo,
    deployAnchorAndGateway,
    deployAnchorAndCoGateway,
};
