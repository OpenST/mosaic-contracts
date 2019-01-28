// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

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

const colors = require('colors/safe');

const {
    Contract,
    ContractRegistry,
    UnlockedWeb3Signer,
    deployContracts,
} = require('../deployment_tool');
const {
    createAnchor,
    createEIP20CoGateway,
    createEIP20Gateway,
    createLibraryConracts,
    createOSTPrime,
    createOrganization,
} = require('./contracts');

// root directory of npm project
const rootDir = `${__dirname}/../../`;

/**
 * Returns the provided address as-is or deploys a new EIP20Token and returns its
 * address if the provided address is the special string "new".
 *
 * @param {object} web3 The web3 instance to use.
 * @param {Address} deployerAddress Address of the account to use for deployment.
 * @param {Address|string} eip20Address Either an existing address of a EIP20Token,
 *                 or the special string "new".
 * @param {object} deployOptions See {@link deployContracts}.
 *
 * @returns {Address} The address of either the provided EIP20Token or the
 *                   newly deployed one.
 */
const deployedToken = async (web3, deployerAddress, eip20Address, deployOptions) => {
    if (eip20Address !== 'new') {
        return eip20Address;
    }

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
 * Get information about the chain that is required for Gateway deployment.
 *
 * @param {object} web3 The web3 instance to query for chain info.
 *
 * @returns {ChainInfo} The chain information of the most recent block on the chain.
 */
const getChainInfo = async (web3) => {
    const chainId = await web3.eth.net.getId();
    const block = await web3.eth.getBlock('latest');

    return {
        chainId,
        blockHeight: block.number,
        stateRoot: block.stateRoot,
    };
};

/**
 * Deploy Anchor, Gateway, Organization and their required contracts on Origin.
 *
 * @param {object} web3Origin The web3 instance of the Origin chain.
 * @param {string} deployerAddress The address of the deployer.
 * @param {string} tokenAddress The address of the EIP20Token contract
 *                       that will be staked.
 * @param {string} baseTokenAddress The address of the EIP20Token contract
 *                                  that will be used for staking bounty from
 *                                  the facilitators.
 * @param {string|number} bounty The amount that facilitators will stake to
 *                               initiate the saking process.
 * @param {string} chainIdAuxiliary The chain id of the Auxiliary chain.
 * @param {string} blockHeightAuxiliary The block height at wich Anchor starts
 *                                      tracking Auxiliary.
 * @param {string} stateRootAuxiliary The state root at `blockHeightAuxiliary`.
 *
 * @returns {Promise.<object>} A promise resolving to a mapping of contract
 *                             names to their deployed addresses.
 */
const deployOrigin = async (
    web3Origin,
    deployerAddress,
    tokenAddress,
    baseTokenAddress,
    bounty,
    chainIdAuxiliary,
    blockHeightAuxiliary,
    stateRootAuxiliary,
) => {
    const startingNonce = await web3Origin.eth.getTransactionCount(deployerAddress);

    const {
        MerklePatriciaProof,
        GatewayLib,
        MessageBus,
    } = createLibraryConracts();
    const Organization = createOrganization(
        deployerAddress, // FIXME: #623
        deployerAddress, // FIXME: #623
        [deployerAddress], // FIXME: #623
        '100000000000', // FIXME: #623
    );
    const Anchor = createAnchor(
        Organization.reference(),
        chainIdAuxiliary,
        blockHeightAuxiliary,
        stateRootAuxiliary,
        '10', // FIXME: #623
    );

    const EIP20Gateway = createEIP20Gateway(
        tokenAddress,
        baseTokenAddress,
        Anchor.reference(),
        bounty,
        Organization.reference(),
        '0x0000000000000000000000000000000000000000', // FIXME: #623; burner address
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
        new UnlockedWeb3Signer(web3Origin),
        web3Origin,
        deploymentObjects,
    );
};


/**
 * Deploy Anchor, CoGateway, Organization and their required contracts on Auxiliary.
 *
 * @param {object} web3Auxiliary The web3 instance of the Auxiliary chain.
 * @param {string} deployerAddress The address of the deployer.
 * @param {string} tokenAddressOrigin The address of the EIP20Token contract
 *                                    on Origin.
 * @param {string} gatewayAddress The address of the Gateway on Origin.
 * @param {string|number} bounty The amount that facilitators will stake to
 *                               initiate the saking process.
 * @param {string} chainIdOrigin The chain id of the Origin chain.
 * @param {string} blockHeightOrigin The block height at wich Anchor starts
 *                                      tracking Origin.
 * @param {string} stateRootOrigin The state root at `blockHeightOrigin`.
 *
 * @returns {Promise.<object>} A promise resolving to a mapping of contract
 *                             names to their deployed addresses.
 */
const deployAuxiliary = async (
    web3Auxiliary,
    deployerAddress,
    tokenAddressOrigin,
    gatewayAddress,
    bounty,
    chainIdOrigin,
    blockHeightOrigin,
    stateRootOrigin,
) => {
    const startingNonce = await web3Auxiliary.eth.getTransactionCount(deployerAddress);

    const {
        MerklePatriciaProof,
        GatewayLib,
        MessageBus,
    } = createLibraryConracts();
    const Organization = createOrganization(
        deployerAddress, // FIXME: #623
        deployerAddress, // FIXME: #623
        [deployerAddress], // FIXME: #623
        '100000000000', // FIXME: #623
    );
    const Anchor = createAnchor(
        Organization.reference(),
        chainIdOrigin,
        blockHeightOrigin,
        stateRootOrigin,
        '10', // FIXME: #623
    );

    const OSTPrime = createOSTPrime(
        tokenAddressOrigin,
        Organization.reference(),
    );

    const EIP20CoGateway = createEIP20CoGateway(
        tokenAddressOrigin,
        OSTPrime.reference(),
        Anchor.reference(),
        bounty,
        Organization.reference(),
        gatewayAddress,
        '0x0000000000000000000000000000000000000000', // FIXME: #623; burner address
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
        new UnlockedWeb3Signer(web3Auxiliary),
        web3Auxiliary,
        deploymentObjects,
    );
};

module.exports = {
    deployAuxiliary,
    deployOrigin,
    deployedToken,
    getChainInfo,
};
