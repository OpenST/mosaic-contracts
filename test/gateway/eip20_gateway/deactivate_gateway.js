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
const Utils = require('../../../test/test_lib/utils');

const Gateway = artifacts.require('./EIP20Gateway.sol');
const MockOrganization = artifacts.require('MockOrganization.sol');

const NullAddress = Utils.NULL_ADDRESS;

contract('EIP20Gateway.deactivateGateway()', (accounts) => {
  const owner = accounts[2];
  const worker = accounts[3];
  const coGateway = accounts[5];
  const burner = NullAddress;

  let gateway;
  let organization;

  beforeEach(async () => {
    const [mockToken, baseToken, dummyStateRootProvider] = accounts;
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

    await gateway.activateGateway(coGateway, { from: owner });
  });

  it('should deactivate if activated', async () => {
    const isSuccess = await gateway.deactivateGateway.call({ from: owner });

    assert.strictEqual(
      isSuccess,
      true,
      'Gateway deactivation failed, deactivateGateway returned false.',
    );

    await gateway.deactivateGateway({ from: owner });
    const isActivated = await gateway.activated.call();

    assert.strictEqual(
      isActivated,
      false,
      'Activation flag is true but expected as false.',
    );
  });

  it('should not deactivate if already deactivated', async () => {
    await gateway.deactivateGateway({ from: owner });
    await Utils.expectRevert(
      gateway.deactivateGateway.call({ from: owner }),
      'Gateway is already deactivated.',
    );
  });

  it('should deactivated by organization only', async () => {
    await Utils.expectRevert(
      gateway.deactivateGateway.call({ from: accounts[0] }),
      'Only the organization is allowed to call this method.',
    );
  });
});
