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

const CoGateway = artifacts.require('EIP20CoGateway');
const MockToken = artifacts.require('MockToken');
const MockOrganization = artifacts.require('MockOrganization.sol');

const BN = require('bn.js');
const Utils = require('./../../test_lib/utils');

const NullAddress = Utils.NULL_ADDRESS;

contract('EIP20CoGateway.constructor() ', (accounts) => {
  let valueToken;
  let utilityToken;
  let bountyAmount;
  let dummyStateRootProvider;
  let owner;
  let worker;
  let organization;
  let coGateway;

  const gatewayAddress = accounts[6];
  const burner = NullAddress;

  beforeEach(async () => {
    valueToken = await MockToken.new();
    utilityToken = await MockToken.new();
    dummyStateRootProvider = accounts[1];
    bountyAmount = new BN(100);

    owner = accounts[2];
    worker = accounts[3];
    organization = await MockOrganization.new(owner, worker);
  });

  it('should able to deploy contract with correct parameters.', async () => {
    coGateway = await CoGateway.new(
      valueToken.address,
      utilityToken.address,
      dummyStateRootProvider,
      bountyAmount,
      organization.address,
      gatewayAddress,
      burner,
    );

    assert(
      web3.utils.isAddress(coGateway.address),
      'Returned value is not a valid address.',
    );
  });

  it('should initialize coGateway contract with correct parameters.', async () => {
    coGateway = await CoGateway.new(
      valueToken.address,
      utilityToken.address,
      dummyStateRootProvider,
      bountyAmount,
      organization.address,
      gatewayAddress,
      burner,
    );

    const valueTokenAddress = await coGateway.valueToken.call();

    assert.strictEqual(
      valueTokenAddress,
      valueToken.address,
      'Invalid valueTokenAddress address from contract.',
    );

    const utilityTokenAddress = await coGateway.utilityToken.call();
    assert.strictEqual(
      utilityTokenAddress,
      utilityToken.address,
      'Invalid bounty token address from contract.',
    );

    const stateRootProviderAdd = await coGateway.stateRootProvider.call();
    assert.strictEqual(
      stateRootProviderAdd,
      dummyStateRootProvider,
      'Invalid stateRootProvider address from contract.',
    );

    const bounty = await coGateway.bounty.call();
    assert(bounty.eq(bountyAmount), 'Invalid bounty amount from contract');
  });

  it('should not deploy contract if value token is passed as zero.', async () => {
    const valueTokenAddress = NullAddress;

    await Utils.expectRevert(
      CoGateway.new(
        valueTokenAddress,
        utilityToken.address,
        dummyStateRootProvider,
        bountyAmount,
        organization.address,
        gatewayAddress,
        burner,
      ),
      'Value token address must not be zero.',
    );
  });

  it('should not deploy contract if utility token is passed as zero.', async () => {
    const utilityTokenAddress = NullAddress;

    await Utils.expectRevert(
      CoGateway.new(
        valueToken.address,
        utilityTokenAddress,
        dummyStateRootProvider,
        bountyAmount,
        organization.address,
        gatewayAddress,
        burner,
      ),
      'Utility token address must not be zero.',
    );
  });

  it('should not deploy contract if state root provider contract address is passed as zero.', async () => {
    const stateRootProviderAddress = NullAddress;

    await Utils.expectRevert(
      CoGateway.new(
        valueToken.address,
        utilityToken.address,
        stateRootProviderAddress,
        bountyAmount,
        organization.address,
        gatewayAddress,
        burner,
      ),
      'State root provider contract address must not be zero.',
    );
  });

  it('should able to deploy contract with zero bounty.', async () => {
    const bountyAmount = new BN(0);

    coGateway = await CoGateway.new(
      valueToken.address,
      utilityToken.address,
      dummyStateRootProvider,
      bountyAmount,
      organization.address,
      gatewayAddress,
      burner,
    );

    assert(
      web3.utils.isAddress(coGateway.address),
      'Returned value is not a valid address.',
    );
  });
});
