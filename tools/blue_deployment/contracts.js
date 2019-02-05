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
 * This module contains factory methods to create instances of undeployed Contracts.
 * It deals with loading the contracts from the correct location.
 */

const { Contract } = require('../deployment_tool');
// root directory of npm project
const rootDir = `${__dirname}/../../`;

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
const createOrganization = (adminAddress, ownerAddress, workerAddresses, expirationHeight) => Contract.loadTruffleContract('Organization', [
  adminAddress,
  ownerAddress,
  workerAddresses,
  expirationHeight,
], { rootDir });

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
) => Contract.loadTruffleContract(
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

const createOSTPrime = (
  tokenAddressOrigin,
  organizationAddress,
) => Contract.loadTruffleContract(
  'OSTPrime',
  [
    tokenAddressOrigin,
    organizationAddress,
  ],
  { rootDir },
);

const createEIP20Gateway = (
  tokenAddress,
  baseTokenAddress,
  anchorAddress,
  bounty,
  organizationAddress,
  burnerAddress = '0x0000000000000000000000000000000000000000',
) => Contract.loadTruffleContract(
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

const createEIP20CoGateway = (
  tokenAddressOrigin,
  ostPrimeAddress,
  anchorAddress,
  bounty,
  organizationAddress,
  gatewayAddress,
  burnerAddress = '0x0000000000000000000000000000000000000000',
) => Contract.loadTruffleContract(
  'EIP20CoGateway',
  [
    tokenAddressOrigin,
    ostPrimeAddress,
    anchorAddress,
    bounty,
    organizationAddress,
    gatewayAddress,
    burnerAddress,
  ],
  { rootDir },
);

module.exports = {
  createAnchor,
  createEIP20CoGateway,
  createEIP20Gateway,
  createLibraryConracts,
  createOSTPrime,
  createOrganization,
};
