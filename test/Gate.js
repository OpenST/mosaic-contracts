// Copyright 2017 OpenST Ltd.
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
// Test: Gate.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Utils = require('./lib/utils.js');
const BigNumber = require('bignumber.js');
const Gate_utils = require('./Gate_utils.js');


contract('OpenSTValue', function(accounts) {

  beforeEach (async () => {
    result   = await Gate_utils.deployGate(artifacts, accounts);
    valueToken  = result.valueToken;
    openSTValue = result.openSTValue;
    uuid = result.uuid;
    gate = result.gate;
    workers = result.workers;
    bounty = result.bounty;
  });

  describe('Properties', async () => {


    it('has workers', async () => {
      assert.equal(await gate.workers.call(), workers);
    });

    it('has bounty', async () => {
      let bountyValue = await gate.bounty.call();
      assert.equal(bountyValue.toNumber(), bounty);
    });

    it('has uuid', async () => {
      let gateUUID = await gate.uuid.call();
      assert.equal(gateUUID, uuid);
    });

    it('has openSTProtocol', async () => {
      assert.equal(await gate.openSTProtocol.call(), openSTValue.address);
    });
  })

  describe('requestStake', async () => {

    it('happy case', async () => {
      assert.equal(await gate.workers.call(), workers);
    });

  })

});
