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

const BN = require('bn.js');

const Utils = require('../test/test_lib/utils.js');

const MockOrganization = artifacts.require('MockOrganization.sol');
const Anchor = artifacts.require('./Anchor.sol');
const Gateway = artifacts.require('TestEIP20Gateway');
const CoGateway = artifacts.require('TestEIP20CoGateway');
const MockToken = artifacts.require('MockToken');
const MockUtilityToken = artifacts.require('MockUtilityToken');


/**
 * Deploy the contracts for proof generation.
 *
 * @param web3Provider {Web3} web3 provider object.
 * @param accounts {Array} accounts An array of available accounts.
 *
 * @returns {Object} Object containing the deployed contracts.
 */
async function deployer(web3Provider, accounts) {
  const owner = accounts[0];
  const worker = accounts[1];
  const remoteChainId = new BN(1410);
  const blockHeight = new BN(5);
  const stateRoot = web3Provider.utils.sha3('dummy_state_root');
  const maxNumberOfStateRoots = new BN(10);
  const bounty = new BN(100);
  const organization = await MockOrganization.new(owner, worker);
  const burner = Utils.NULL_ADDRESS;
  const maxStorageRootItems = new BN(50);

  const anchor = await Anchor.new(
    remoteChainId,
    blockHeight,
    stateRoot,
    maxNumberOfStateRoots,
    organization.address,
  );
  const mockToken = await MockToken.new({ from: accounts[0] });
  const baseToken = await MockToken.new({ from: accounts[0] });

  const mockUtilityToken = await MockUtilityToken.new(
    mockToken.address,
    '',
    '',
    18,
    organization.address,
    { from: owner },
  );

  const gateway = await Gateway.new(
    mockToken.address,
    baseToken.address,
    anchor.address,
    bounty,
    organization.address,
    burner,
    maxStorageRootItems,
  );

  const coGateway = await CoGateway.new(
    mockToken.address,
    mockUtilityToken.address,
    anchor.address,
    bounty,
    organization.address,
    gateway.address,
    burner,
    maxStorageRootItems,
  );

  await mockUtilityToken.setCoGateway(coGateway.address, { from: owner });
  await gateway.activateGateway(coGateway.address, { from: owner });
  return {
    gateway,
    coGateway,
    organization,
    mockToken,
    baseToken,
    mockUtilityToken,
    anchor,
    owner,
    worker,
    bounty,
  };
}

module.exports = deployer;
