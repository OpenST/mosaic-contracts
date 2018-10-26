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
// Test: get_accumulate_gas_target.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------
const web3 = require('../../test_lib/web3.js');
const BN = require('bn.js');
const OriginCore = artifacts.require('OriginCore');

contract('OriginCore.getAccumulatedGasTarget()', async (accounts) => {

  /**
   * @dev while writing this test commitMetaBlock function is not
   *      implemented, So once its updated the tests should be updated to use
   *      commitMetaBlock function. Currently this tests are using the genesis
   *      meta block for testing
   */

  let originCore,
    maxAccumulateGasLimit,
    gas,
    auxiliaryCoreIdentifier,
    transactionRoot,
    ost,
    minimumWeight
  ;

  /** Deploys the origin core contract */
  async function deployOriginCore(){
    originCore = await OriginCore.new(
      auxiliaryCoreIdentifier,
      ost,
      gas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );
  }

  /** Asserts the accumulated gas target */
  async function testAccumulatedGasTarget(){
    await deployOriginCore();
    let accumulatedGasTarget = await originCore.getAccumulatedGasTarget.call();
    assert(
      accumulatedGasTarget.eq(gas.add(maxAccumulateGasLimit)),
      `Accumulated gas target should` +
        `be ${gas.add(maxAccumulateGasLimit).toString(10)}`
    )
  }

  beforeEach(async () => {
    auxiliaryCoreIdentifier = web3.utils.sha3("1");
    transactionRoot= web3.utils.sha3("1");
    ost = accounts[0];
    minimumWeight = new BN('1');
  });

  it('should return 200 as accumulate gas target', async function () {
      gas = new BN('100');
      maxAccumulateGasLimit = new BN('100');
      await testAccumulatedGasTarget();
  });

  it('should return 1245 as accumulate gas target', async function () {
    gas = new BN('245');
    maxAccumulateGasLimit = new BN('1000');
    await testAccumulatedGasTarget();
  });

});
