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
const EventDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');

const TestData = require('./helpers/data.js');

const AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');
const MockBlockStore = artifacts.require('MockBlockStore');

contract('AuxiliaryBlockStore.reportBlock()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const epochLength = new BN('3');
  const pollingPlaceAddress = accounts[0];
  let originBlockStore;
  const testBlocks = TestData.blocks;
  const initialBlockHash = TestData.initialBlock.hash;
  const initialStateRoot = TestData.initialBlock.stateRoot;
  const initialGas = TestData.initialBlock.gas;
  const initialTransactionRoot = TestData.initialBlock.transactionRoot;
  const initialHeight = TestData.initialBlock.height;
  const initialKernelHash = TestData.initialBlock.kernelHash;

  let blockStore;

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
  });

  it('should accept a valid report', async () => {
    const keys = Object.keys(testBlocks);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const testBlock = testBlocks[key];

      await blockStore.reportBlock(testBlock.header);

      const reported = await blockStore.isBlockReported.call(testBlock.hash);
      assert.strictEqual(
        reported,
        true,
        'A reported block must be registered as reported.',
      );
    }
  });

  it('should emit an event when a block is reported', async () => {
    const keys = Object.keys(testBlocks);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const testBlock = testBlocks[key];

      const tx = await blockStore.reportBlock(testBlock.header);

      const event = EventDecoder.getEvents(tx, blockStore);
      assert.strictEqual(
        event.BlockReported.blockHash,
        testBlock.hash,
      );
    }
  });

  it('should revert when the RLP encoding is invalid', async () => {
    // Changed the first character
    const invalidEncodedHeader = '0xa901f9a07f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830ca01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';

    await Utils.expectRevert(
      blockStore.reportBlock(
        invalidEncodedHeader,
      ),
    );
  });

  it('should track the accumulated gas', async () => {
    let expectedAccumulatedGas = initialGas;

    const keys = Object.keys(testBlocks);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const testBlock = testBlocks[key];
      expectedAccumulatedGas = expectedAccumulatedGas.add(testBlock.gas);

      await blockStore.reportBlock(testBlock.header);

      const accumulatedGas = await blockStore.accumulatedGases.call(testBlock.hash);
      assert(
        accumulatedGas.eq(expectedAccumulatedGas),
        'The accumulated gas must increase by the amount of the block.',
      );
    }
  });

  it('should track the accumulated transaction root', async () => {
    let expectedAccumulatedTxRoot = initialTransactionRoot;

    const keys = Object.keys(testBlocks);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const testBlock = testBlocks[key];

      expectedAccumulatedTxRoot = AuxStoreUtils.accumulateTransactionRoot(
        expectedAccumulatedTxRoot,
        testBlock.transactionRoot,
      );

      await blockStore.reportBlock(testBlock.header);

      const accumulatedTxRoot = await blockStore
        .accumulatedTransactionRoots
        .call(testBlock.hash);

      assert.strictEqual(
        accumulatedTxRoot,
        expectedAccumulatedTxRoot,
        'The accumulated transaction root must be correct for a new block.',
      );
    }
  });

  it('should track the origin dynasty', async () => {
    const keys = Object.keys(testBlocks);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const testBlock = testBlocks[key];
      const expectedDynasty = new BN(i);

      await originBlockStore.setCurrentDynasty(expectedDynasty);
      await blockStore.reportBlock(testBlock.header);

      const recordedDynasty = await blockStore.originDynasties.call(testBlock.hash);
      assert(
        recordedDynasty.eq(expectedDynasty),
        'The origin dynasty must be correct for a new block.',
      );
    }
  });

  it('should track the origin head\'s hash', async () => {
    const keys = Object.keys(testBlocks);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const testBlock = testBlocks[key];

      await originBlockStore.setHead(testBlock.hash);
      await blockStore.reportBlock(testBlock.header);

      const recordedHead = await blockStore.originBlockHashes.call(testBlock.hash);
      assert.strictEqual(
        recordedHead,
        testBlock.hash,
        'The origin head hash must be correct for a new block.',
      );
    }
  });
});
