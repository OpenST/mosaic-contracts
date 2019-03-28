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
const KernelGateway = artifacts.require('TestKernelGateway');

contract('AuxiliaryBlockStore.justify()', async (accounts) => {
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
  const unknownBlockHash = '0x123456f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e0139654321';
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

    const kernelGateway = await KernelGateway.new(
      accounts[10],
      originBlockStore.address,
      blockStore.address,
      initialKernelHash,
    );

    await blockStore.initialize(kernelGateway.address);
    await AuxStoreUtils.reportBlocks(blockStore, testBlocks);
  });

  it('should accept a valid justification', async () => {
    const testJustifications = [
      {
        source: initialBlockHash,
        target: testBlocks[3].hash,
        sourceFinalised: true,
      },
      {
        source: testBlocks[3].hash,
        target: testBlocks[6].hash,
        sourceFinalised: true,
      },
      {
        source: testBlocks[6].hash,
        target: testBlocks[12].hash,
        sourceFinalised: false,
      },
      {
        source: testBlocks[6].hash,
        target: testBlocks[9].hash,
        sourceFinalised: true,
      },
    ];

    const count = testJustifications.length;
    for (let i = 0; i < count; i += 1) {
      const testJustification = testJustifications[i];

      await blockStore.justify(
        testJustification.source,
        testJustification.target,
        { from: pollingPlaceAddress },
      );

      // Assert that the checkpoint is recorded with the correct data.
      const checkpointTarget = await blockStore.checkpoints.call(
        testJustification.target,
      );
      assert.strictEqual(
        checkpointTarget.blockHash,
        testJustification.target,
      );
      assert.strictEqual(
        checkpointTarget.parent,
        testJustification.source,
      );
      assert.strictEqual(
        checkpointTarget.justified,
        true,
      );

      // The source should possibly be finalised (depends on distance).
      const checkpointSource = await blockStore.checkpoints.call(
        testJustification.source,
      );
      assert.strictEqual(
        checkpointSource.finalised,
        testJustification.sourceFinalised,
      );
    }
  });

  it('should emit an event when a checkpoint is justified', async () => {
    const tx = await blockStore.justify(
      initialBlockHash,
      testBlocks[3].hash,
      { from: pollingPlaceAddress },
    );

    const event = EventDecoder.getEvents(tx, blockStore);
    assert.strictEqual(
      event.BlockJustified.blockHash,
      testBlocks[3].hash,
    );
  });

  it('should emit an event when a checkpoint is finalised', async () => {
    await blockStore.justify(
      initialBlockHash,
      testBlocks[6].hash,
      { from: pollingPlaceAddress },
    );
    const tx = await blockStore.justify(
      testBlocks[6].hash,
      testBlocks[9].hash,
      { from: pollingPlaceAddress },
    );

    const event = EventDecoder.getEvents(tx, blockStore);
    assert.strictEqual(
      event.BlockFinalised.blockHash,
      testBlocks[6].hash,
    );
  });

  it(
    'should not emit a finalisation event when the target is not the '
    + 'direct child',
    async () => {
      const tx = await blockStore.justify(
        initialBlockHash,
        testBlocks[6].hash,
        { from: pollingPlaceAddress },
      );

      const event = EventDecoder.getEvents(tx, blockStore);
      assert.strictEqual(
        event.BlockFinalised,
        undefined,
      );
    },
  );

  it(
    'should not accept a justification from an address other than the '
    + 'polling place',
    async () => {
      await Utils.expectRevert(
        blockStore.justify(
          initialBlockHash,
          testBlocks[6].hash,
          { from: accounts[4] },
        ),
        'This method must be called from the registered polling place.',
      );
    },
  );

  it('should not accept an unknown source hash', async () => {
    await Utils.expectRevert(
      blockStore.justify(
        unknownBlockHash,
        testBlocks[6].hash,
        { from: pollingPlaceAddress },
      ),
      'The source block must first be reported.',
    );
  });

  it('should not accept an unknown target hash', async () => {
    await Utils.expectRevert(
      blockStore.justify(
        initialBlockHash,
        unknownBlockHash,
        { from: pollingPlaceAddress },
      ),
      'The target block must first be reported.',
    );
  });

  it('should not accept a source checkpoint that is not justified', async () => {
    await Utils.expectRevert(
      blockStore.justify(
        testBlocks[6].hash,
        testBlocks[9].hash,
        { from: pollingPlaceAddress },
      ),
      'The source block must first be justified.',
    );
  });

  it(
    'should not accept a target block that has a height that is not a '
    + 'multiple of the epoch length',
    async () => {
      await Utils.expectRevert(
        blockStore.justify(
          initialBlockHash,
          testBlocks[2].hash,
          { from: pollingPlaceAddress },
        ),
        'The target must be at a height that is a multiple of the '
        + 'epoch length.',
      );
    },
  );

  it('should not accept a target block that has a height lower than the head', async () => {
    await blockStore.justify(
      initialBlockHash,
      testBlocks[3].hash,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      testBlocks[3].hash,
      testBlocks[6].hash,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      testBlocks[6].hash,
      testBlocks[9].hash,
      { from: pollingPlaceAddress },
    );

    await Utils.expectRevert(
      blockStore.justify(
        testBlocks[3].hash,
        testBlocks[6].hash,
        { from: pollingPlaceAddress },
      ),
      'The target must be higher than the head.',
    );
  });

  it('should not allow the target to be below the source', async () => {
    await blockStore.justify(
      initialBlockHash,
      testBlocks[6].hash,
      { from: pollingPlaceAddress },
    );
    await Utils.expectRevert(
      blockStore.justify(
        testBlocks[6].hash,
        testBlocks[3].hash,
        { from: pollingPlaceAddress },
      ),
      'The target must be above the source in height.',
    );
  });

  it('should not allow the target to be justified with a different source', async () => {
    await blockStore.justify(
      initialBlockHash,
      testBlocks[3].hash,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      testBlocks[3].hash,
      testBlocks[6].hash,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      testBlocks[3].hash,
      testBlocks[9].hash,
      { from: pollingPlaceAddress },
    );

    await Utils.expectRevert(
      blockStore.justify(
        testBlocks[6].hash,
        testBlocks[9].hash,
        { from: pollingPlaceAddress },
      ),
      'The target must not be justified already.',
    );
  });

  it('should not allow the target to not be a descendant of the source', async () => {
    // The fork blocks have a different transaction root (and thus hash).
    const forkBlocks = {
      1: {
        header: '0xf901f9a07f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830ca01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a06fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4',
        hash: '0x168032d5593d56e2b392a6233b9fd3282b5544950a38c127266321b406c056ff',
      },
      2: {
        header: '0xf901f9a0168032d5593d56e2b392a6233b9fd3282b5544950a38c127266321b406c056ffa01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a06fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000002832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4',
        hash: '0x18b5efebac8e5d3344858fc4130d9349b986a5de11b8e4527f69b2eb62bc2578',
      },
      3: {
        header: '0xf901f9a018b5efebac8e5d3344858fc4130d9349b986a5de11b8e4527f69b2eb62bc2578a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a06fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000003832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4',
        hash: '0x2b626bb13bb77d56dc39a7e8d8fa13c00be2d9332a738dc57796762541981a8a',
      },
      4: {
        header: '0xf901f9a02b626bb13bb77d56dc39a7e8d8fa13c00be2d9332a738dc57796762541981a8aa01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a06fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000004832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4',
        hash: '0x685adb72bd64e87d7aaae0a39585bc80832be03a6922de3bbd96045841cf5c7b',
      },
      5: {
        header: '0xf901f9a0685adb72bd64e87d7aaae0a39585bc80832be03a6922de3bbd96045841cf5c7ba01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a06fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000005832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4',
        hash: '0x34c1e15f82e43dab8fdefabfb232cbbc812a0bc9cc0d3e4dd4a4457a3bdbc677',
      },
      6: {
        header: '0xf901f9a034c1e15f82e43dab8fdefabfb232cbbc812a0bc9cc0d3e4dd4a4457a3bdbc677a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a06fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000006832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4',
        hash: '0x2f859242c8af9a91c2bd759aded6802e7e769225a9c3a55f9908f8770d46b090',
      },
    };
    await AuxStoreUtils.reportBlocks(blockStore, forkBlocks);

    /*
     * Justifying on the original fork and then jumping to the alternative
     * fork to check for validity of a justification.
     */
    await blockStore.justify(
      initialBlockHash,
      testBlocks[3].hash,
      { from: pollingPlaceAddress },
    );
    await Utils.expectRevert(
      blockStore.justify(
        testBlocks[3].hash,
        forkBlocks[6].hash,
        { from: pollingPlaceAddress },
      ),
      'The source must be an ancestor of the target.',
    );
  });
});
