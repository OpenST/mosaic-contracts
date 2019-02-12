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
const web3 = require('../../test_lib/web3.js');

const MosaicCore = artifacts.require('MosaicCore');

contract('MosaicCore.getAccumulatedGasTarget()', async (accounts) => {
  /**
   * @dev while writing this test commitMetaBlock function is not
   *      implemented, So once its updated the tests should be updated to use
   *      commitMetaBlock function. Currently this tests are using the genesis
   *      meta block for testing
   */

  let mosaicCore;
  let maxAccumulateGasLimit;
  let gas;
  let auxiliaryCoreIdentifier;
  let transactionRoot;
  let ost;
  let minimumWeight;

  /** Deploys the mosaic core contract */
  async function deployMosaicCore() {
    mosaicCore = await MosaicCore.new(
      auxiliaryCoreIdentifier,
      ost,
      gas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );
  }

  /** Asserts the accumulated gas target */
  async function testAccumulatedGasTarget() {
    await deployMosaicCore();
    const accumulatedGasTarget = await mosaicCore.getAccumulatedGasTarget.call();
    assert(
      accumulatedGasTarget.eq(gas.add(maxAccumulateGasLimit)),
      'Accumulated gas target should'
        + `be ${gas.add(maxAccumulateGasLimit).toString(10)}`,
    );
  }

  beforeEach(async () => {
    auxiliaryCoreIdentifier = web3.utils.sha3('1');
    transactionRoot = web3.utils.sha3('1');
    ost = accounts[0];
    minimumWeight = new BN('1');
  });

  it('should return 200 as accumulate gas target', async () => {
    gas = new BN('100');
    maxAccumulateGasLimit = new BN('100');
    await testAccumulatedGasTarget();
  });

  it('should return 1245 as accumulate gas target', async () => {
    gas = new BN('245');
    maxAccumulateGasLimit = new BN('1000');
    await testAccumulatedGasTarget();
  });
});
