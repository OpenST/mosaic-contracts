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

const Utils = require('../../test_lib/utils.js');

const BlockStore = artifacts.require('BlockStore');

contract('BlockStore.constructor()', async (accounts) => {
  it('should accept a valid construction', async () => {
    await BlockStore.new(
      '0x0000000000000000000000000000000000000001',
      10,
      accounts[0],
      '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c',
      '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca',
      0,
    );
  });

  it('should store the correct core identifier', async () => {
    const blockStore = await BlockStore.new(
      '0x0000000000000000000000000000000000000001',
      10,
      accounts[0],
      '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c',
      '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca',
      0,
    );

    const coreId = await blockStore.getCoreIdentifier.call();
    assert.strictEqual(
      coreId,
      '0x0000000000000000000000000000000000000001',
      'The contract did not store the correct core identifier.',
    );
  });

  it('should not accept a zero epoch length', async () => {
    await Utils.expectRevert(
      BlockStore.new(
        '0x0000000000000000000000000000000000000001',
        0,
        accounts[0],
        '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c',
        '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca',
        0,
      ),
      'Epoch length must be greater zero.',
    );
  });

  it('should not accept a zero polling place address', async () => {
    await Utils.expectRevert(
      BlockStore.new(
        '0x0000000000000000000000000000000000000001',
        10,
        Utils.NULL_ADDRESS,
        '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c',
        '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca',
        0,
      ),
      'Address of polling place must not be zero.',
    );
  });

  it('should not accept a zero initial block hash', async () => {
    await Utils.expectRevert(
      BlockStore.new(
        '0x0000000000000000000000000000000000000001',
        10,
        accounts[0],
        Utils.ZERO_BYTES32,
        '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca',
        0,
      ),
      'Initial block hash must not be zero.',
    );
  });

  it('should not accept a zero initial state root', async () => {
    await Utils.expectRevert(
      BlockStore.new(
        '0x0000000000000000000000000000000000000001',
        10,
        accounts[0],
        '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c',
        Utils.ZERO_BYTES32,
        0,
      ),
      'Initial state root must not be zero.',
    );
  });

  it('should not accept incompatible epoch length and initial block height', async () => {
    const testData = [
      { epochLength: 2, initialBlockHeight: 3 },
      { epochLength: 10, initialBlockHeight: 66 },
      { epochLength: 15, initialBlockHeight: 20 },
      { epochLength: 300, initialBlockHeight: 150 },
    ];

    const count = testData.length;
    for (let i = 0; i < count; i++) {
      const testDate = testData[i];

      await Utils.expectRevert(
        BlockStore.new(
          '0x0000000000000000000000000000000000000001',
          testDate.epochLength,
          accounts[0],
          '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c',
          '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca',
          testDate.initialBlockHeight,
        ),
        'The initial block height is incompatible to the epoch '
          + 'length. Must be a multiple.',
      );
    }
  });
});
