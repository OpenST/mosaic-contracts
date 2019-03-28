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
const AuxStoreUtils = require('./helpers/aux_store_utils.js');

const TestData = require('./helpers/data.js');

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');
const MockBlockStore = artifacts.require('MockBlockStore');
const KernelGateway = artifacts.require('TestKernelGateway');

contract('AuxiliaryBlockStore.latestBlockHeight()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const epochLength = new BN('3');
  const pollingPlaceAddress = accounts[0];
  let originBlockStore;
  const initialBlockHash = TestData.blocks[3].hash;
  const initialStateRoot = TestData.blocks[3].stateRoot;
  const initialGas = TestData.blocks[3].accumulatedGas;
  const initialTransactionRoot = TestData.blocks[3].transactionRoot;
  const initialHeight = new BN('3');
  const initialKernelHash = TestData.initialBlock.kernelHash;

  let blockStore;

  // Heights 4-12
  const testBlocks = AuxStoreUtils.getSubset(4, 12, TestData.blocks);

  beforeEach(async () => {
    originBlockStore = await MockBlockStore.new();

    blockStore = await AuxiliaryBlockStore.new(
      coreIdentifier,
      epochLength,
      pollingPlaceAddress,
      originBlockStore.address,
      initialBlockHash,
      initialStateRoot,
      initialHeight,
      initialGas,
      initialTransactionRoot,
      initialKernelHash,
    );

    const kernelGateway = await KernelGateway.new(
      accounts[10],
      originBlockStore.address,
      blockStore.address,
      initialKernelHash,
    );

    await blockStore.initialize(kernelGateway.address);
    await AuxStoreUtils.reportBlocks(blockStore, testBlocks);
  });

  it('should return the correct block height', async () => {
    const testJustifications = [
      {
        source: initialBlockHash,
        target: testBlocks[6].hash,
        expectedHeight: new BN('3'),
      },
      {
        source: testBlocks[6].hash,
        target: testBlocks[12].hash,
        expectedHeight: new BN('3'),
      },
      {
        source: testBlocks[6].hash,
        target: testBlocks[9].hash,
        expectedHeight: new BN('6'),
      },
    ];

    const count = testJustifications.length;
    for (let i = 0; i < count; i += 1) {
      const testJustification = testJustifications[i];

      await blockStore.justify(
        testJustification.source,
        testJustification.target,
      );
      const height = await blockStore.latestBlockHeight.call();
      assert(
        height.eq(testJustification.expectedHeight),
        `The  wrong height was returned. Expected: ${
          testJustification.expectedHeight} Actual: ${height}`,
      );
    }
  });
});
