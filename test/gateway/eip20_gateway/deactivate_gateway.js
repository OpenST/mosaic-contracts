// Copyright 2018 OpenST Ltd.
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

const Gateway = artifacts.require("./EIP20Gateway.sol")
  , BN = require('bn.js');
const MockOrganization = artifacts.require('MockOrganization.sol');

const Utils = require('../../../test/test_lib/utils');

const NullAddress = Utils.NULL_ADDRESS;
contract('EIP20Gateway.deactivateGateway()', function (accounts) {

  let gateway;
  let owner = accounts[2];
  let worker = accounts[3];
  let coGateway = accounts[5];
  let organization;
  let burner = NullAddress;

  beforeEach(async function () {

    let mockToken = accounts[0],
      baseToken = accounts[1],
      dummyStateRootProvider = accounts[2],
      bountyAmount = new BN(100);

    organization = await MockOrganization.new(owner, worker);

    gateway = await Gateway.new(
      mockToken,
      baseToken,
      dummyStateRootProvider,
      bountyAmount,
      organization.address,
      burner
    );

    await gateway.activateGateway(coGateway, { from: owner });

  });

  it('should deactivate if activated', async function () {

    let isSuccess = await gateway.deactivateGateway.call({ from: owner });

    assert.strictEqual(
      isSuccess,
      true,
      "Gateway deactivation failed, deactivateGateway returned false.",
    );

    await gateway.deactivateGateway({ from: owner });
    let isActivated = await gateway.activated.call();

    assert.strictEqual(
      isActivated,
      false,
      'Activation flag is true but expected as false.'
    );
  });

  it('should not deactivate if already deactivated', async function () {

    await gateway.deactivateGateway({ from: owner });
    await Utils.expectRevert(
      gateway.deactivateGateway.call({ from: owner }),
      'Gateway is already deactivated.'
    );
  });

  it('should deactivated by organization only', async function () {

    await Utils.expectRevert(
      gateway.deactivateGateway.call({ from: accounts[0] }),
      'Only the organization is allowed to call this method.'
    );
  });

});
