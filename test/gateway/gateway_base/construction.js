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

const GatewayBase = artifacts.require('./GatewayBase.sol')
  , BN = require('bn.js');

const MockOrganization = artifacts.require('MockOrganization.sol');
const Utils = require('../../../test/test_lib/utils');

const NullAddress = '0x0000000000000000000000000000000000000000';
contract('GatewayBase.sol', function (accounts) {

  describe('Construction', async () => {

    let dummyStateRootProvider, bounty, worker, organization;

    beforeEach(async function () {

      owner = accounts[2]
        , worker = accounts[3]
        , dummyStateRootProvider = accounts[0]
        , bounty = new BN(100);

      organization = await MockOrganization.new(owner, worker);
    });

    it('should pass with right set of parameters', async function () {
      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProvider,
        bounty,
        organization.address,
      );

      assert.strictEqual(
        dummyStateRootProvider,
        await gatewayBaseInstance.stateRootProvider.call(),
        "State root provider contract address doesn't match."
      );
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should pass with right set of parameters and zero bounty', async function () {

      bounty = new BN(0);

      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProvider,
        bounty,
        organization.address,
      );

      assert.equal(dummyStateRootProvider, await gatewayBaseInstance.stateRootProvider.call());
      assert((await gatewayBaseInstance.bounty.call()).eq(bounty));
    });

    it('should fail if state root provider contract address is zero', async function () {

      let stateRootProvider = NullAddress;
      await Utils.expectRevert(
        GatewayBase.new(stateRootProvider, bounty, organization.address),
        "State root provider contract address must not be zero."
      );

    });

    it('should fail if worker manager address is not passed', async function () {

      await Utils.expectRevert(
        GatewayBase.new(dummyStateRootProvider, bounty, NullAddress),
        "Organization contract address must not be zero."
      );

    });
  });
});
