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

const GatewayBase = artifacts.require('./GatewayBase.sol');

const BN = require('bn.js');

const MockOrganization = artifacts.require('MockOrganization.sol');

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

    it('should return 1 nonce if there is no active process', async () => {
      const expectedNonce = new BN(1);
      const nonce = await gatewayBaseInstance.getNonce.call(accounts[0]);
      assert(nonce.eq(expectedNonce));
    });

    it('should return nonce incremented by 1 if stake process is initiated', async () => {
      // todo implement this when stake unit tests are done
    });

    it('should return nonce incremented by 1 if linking process is initiated', async () => {
      // todo implement this when linking unit tests are done
    });
  });
});
