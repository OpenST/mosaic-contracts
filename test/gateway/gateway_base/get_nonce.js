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

const GatewayBase = artifacts.require('./GatewayBase.sol');
const MockOrganization = artifacts.require('MockOrganization.sol');

/*
 * The tests that assert that the nonce increases when staking or redeeming are
 * in the respective test files for stake and redeem.
 */

contract('GatewayBase.sol', (accounts) => {
  describe('get nonce', async () => {
    let gatewayBaseInstance;

    beforeEach(async () => {
      const owner = accounts[2];
      const worker = accounts[3];
      const dummyStateRootProviderAddress = accounts[0];
      const bounty = new BN(100);

      const organization = await MockOrganization.new(owner, worker);

      gatewayBaseInstance = await GatewayBase.new(
        dummyStateRootProviderAddress,
        bounty,
        organization.address,
      );
    });

    it('should return nonce `1` if there is no active process', async () => {
      const expectedNonce = new BN(1);
      const nonce = await gatewayBaseInstance.getNonce.call(accounts[0]);
      assert(nonce.eq(expectedNonce));
    });
  });
});
