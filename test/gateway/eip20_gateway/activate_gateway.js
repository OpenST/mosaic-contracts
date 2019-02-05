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

const Gateway = artifacts.require('./EIP20Gateway.sol');
const MockOrganization = artifacts.require('MockOrganization.sol');

const BN = require('bn.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = Utils.NULL_ADDRESS;
contract('EIP20Gateway.activateGateway()', (accounts) => {
  let gateway;
  const coGateway = accounts[5];
  const owner = accounts[2];
  const worker = accounts[3];
  let organization;
  const burner = NullAddress;

  beforeEach(async () => {
    const mockToken = accounts[0];

    const baseToken = accounts[1];

    const dummyStateRootProvider = accounts[2];

    const bountyAmount = new BN(100);

    organization = await MockOrganization.new(owner, worker);

    gateway = await Gateway.new(
      mockToken,
      baseToken,
      dummyStateRootProvider,
      bountyAmount,
      organization.address,
      burner,
    );
  });

  it('should activate if not already activated', async () => {
    const isSuccess = await gateway.activateGateway.call(coGateway, {
      from: owner,
    });

    assert.strictEqual(
      isSuccess,
      true,
      'Gateway activation failed, activateGateway returned false.',
    );

    await gateway.activateGateway(coGateway, { from: owner });
    const isActivated = await gateway.activated.call();

    assert.strictEqual(
      isActivated,
      true,
      'Activation flag is false but expected as true.',
    );

    const actualCoGateway = await gateway.remoteGateway.call();

    assert.strictEqual(
      coGateway,
      actualCoGateway,
      'Actual cogateway address is different from expected address.',
    );

    const actualEncodedGatewayPath = await gateway.encodedGatewayPath.call();
    const expectedEncodedGatewayPath = web3.utils.sha3(coGateway);

    assert.strictEqual(
      expectedEncodedGatewayPath,
      actualEncodedGatewayPath,
      'Actual encoded gateway path address is different from expected.',
    );
  });

  it('should not activate if already activated', async () => {
    await gateway.activateGateway(coGateway, { from: owner });

    await Utils.expectRevert(
      gateway.activateGateway(coGateway, { from: owner }),
      'Gateway was already activated once.',
    );
  });

  it('should not activate with zero co-gateway address', async () => {
    await Utils.expectRevert(
      gateway.activateGateway(NullAddress, { from: owner }),
      'Co-gateway address must not be zero.',
    );
  });

  it('should be activated by organization only', async () => {
    await Utils.expectRevert(
      gateway.activateGateway(coGateway, { from: accounts[0] }),
      'Only the organization is allowed to call this method.',
    );
  });
});
