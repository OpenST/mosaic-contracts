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
const Utils = require('../../test_lib/utils.js');

const MosaicCore = artifacts.require('TestMosaicCore');

/**
 * @dev This test just verifies the value returned by function
 *      `getStateRoot()` is from `stateRoots` variable.
 */

contract('MosaicCore.getStorageRoot()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const zeroBytes = Utils.ZERO_BYTES32;

  const gas = new BN('100');
  const maxAccumulateGasLimit = new BN('100');
  const transactionRoot = web3.utils.sha3('1');
  const minimumWeight = new BN('1');

  let mosaicCore;
  let ost;

  /** Deploys the mosaic core contract */
  async function deployMosaicCore() {
    mosaicCore = await MosaicCore.new(
      coreIdentifier,
      ost,
      gas,
      transactionRoot,
      minimumWeight,
      maxAccumulateGasLimit,
    );
  }

  beforeEach(async () => {
    ost = accounts[0];
    await deployMosaicCore();
  });

  it('should return zero bytes when the data does not exists.', async () => {
    const height = new BN(1);
    const stateRoot = await mosaicCore.getStateRoot.call(height);

    assert.strictEqual(
      stateRoot,
      zeroBytes,
      'State root from the contract must be zero.',
    );
  });

  it('should return correct bytes when state root exists.', async () => {
    const height = new BN(1);
    const stateRoot = web3.utils.sha3('stateRoot');
    await mosaicCore.setStateRoot(height, stateRoot);

    const cStateRoot = await mosaicCore.getStateRoot.call(height);

    assert.strictEqual(
      cStateRoot,
      stateRoot,
      `State root from the contract must be ${stateRoot}.`,
    );
  });
});
