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
const EventDecoder = require('../../test_lib/event_decoder.js');
const Utils = require('../../test_lib/utils.js');

const BlockStore = artifacts.require('BlockStore');

contract('BlockStore.justify()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const epochLength = new BN('10');
  const pollingPlaceAddress = accounts[0];
  const initialBlockHash = '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c';
  const initialStateRoot = '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca';
  const initialHeight = new BN('0');

  let blockStore;

  let blockHashAtZero;
  let blockHeaderRlpAtTen;
  let blockHashAtTen;
  let blockHeaderRlpAtTwenty;
  let blockHashAtTwenty;
  let blockHeaderRlpAtThirty;
  let blockHashAtThirty;
  let blockHeaderRlpAtFourty;
  let blockHashAtFourty;

  let blockHeaderRlpAtTwentyFive;
  let blockHashAtTwentyFive;
  let unknownBlockHash;

  beforeEach(async () => {
    blockHashAtZero = '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c';
    blockHeaderRlpAtTen = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830200000a832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtTen = '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca';
    blockHeaderRlpAtTwenty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000014832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtTwenty = '0x29697b0bd24d4a4298c44d2a5229eec7145965c62ae5e0a21bd0466a33ecc25c';
    blockHeaderRlpAtThirty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830200001e832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtThirty = '0xfc01ac5155b79257c696b6b81c9d1ad713e4bf4dee8da053b1be7f80e72bad8c';
    blockHeaderRlpAtFourty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000028832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtFourty = '0xcdc5a63f8dec11e46a0b636e1f85b4f4ff71161ef6111aa5092661c5008df8de';

    blockHeaderRlpAtTwentyFive = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000019832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtTwentyFive = '0x1cac15d4c638c16c83562d04a27d8c977939d8700b3b5c6c71333c29fd03341a';
    unknownBlockHash = '0xabcdef3f8dec11e46a0b636e1f85b4f4ff71161ef6111aa5092661c5008df8de';

    blockStore = await BlockStore.new(
      coreIdentifier,
      epochLength,
      pollingPlaceAddress,
      initialBlockHash,
      initialStateRoot,
      initialHeight,
    );

    await blockStore.reportBlock(blockHeaderRlpAtTen);
    await blockStore.reportBlock(blockHeaderRlpAtTwenty);
    await blockStore.reportBlock(blockHeaderRlpAtThirty);
    await blockStore.reportBlock(blockHeaderRlpAtFourty);

    await blockStore.reportBlock(blockHeaderRlpAtTwentyFive);
  });

  it('should accept a valid justification', async () => {
    const testData = [
      {
        source: blockHashAtZero,
        target: blockHashAtTen,
        sourceFinalised: true,
      },
      {
        source: blockHashAtTen,
        target: blockHashAtTwenty,
        sourceFinalised: true,
      },
      {
        source: blockHashAtTwenty,
        target: blockHashAtFourty,
        sourceFinalised: false,
      },
      {
        source: blockHashAtTwenty,
        target: blockHashAtThirty,
        sourceFinalised: true,
      },
    ];

    const count = testData.length;
    for (let i = 0; i < count; i += 1) {
      const testDate = testData[i];

      await blockStore.justify(
        testDate.source,
        testDate.target,
        { from: pollingPlaceAddress },
      );

      // Assert that the checkpoint is recorded with the correct data.
      const checkpointTarget = await blockStore.checkpoints.call(
        testDate.target,
      );
      assert.strictEqual(
        checkpointTarget.blockHash,
        testDate.target,
      );
      assert.strictEqual(
        checkpointTarget.parent,
        testDate.source,
      );
      assert.strictEqual(
        checkpointTarget.justified,
        true,
      );

      // The source should possibly be finalised (depends on distance).
      const checkpointSource = await blockStore.checkpoints.call(
        testDate.source,
      );
      assert.strictEqual(
        checkpointSource.finalised,
        testDate.sourceFinalised,
      );
    }
  });

  it('should emit an event when a checkpoint is justified', async () => {
    const tx = await blockStore.justify(
      blockHashAtZero,
      blockHashAtTen,
      { from: pollingPlaceAddress },
    );

    const event = EventDecoder.getEvents(tx, blockStore);
    assert.strictEqual(
      event.BlockJustified.blockHash,
      blockHashAtTen,
    );
  });

  it('should emit an event when a checkpoint is finalised', async () => {
    await blockStore.justify(
      blockHashAtZero,
      blockHashAtTwenty,
      { from: pollingPlaceAddress },
    );
    const tx = await blockStore.justify(
      blockHashAtTwenty,
      blockHashAtThirty,
      { from: pollingPlaceAddress },
    );

    const event = EventDecoder.getEvents(tx, blockStore);
    assert.strictEqual(
      event.BlockFinalised.blockHash,
      blockHashAtTwenty,
    );
  });

  it(
    'should not emit a finalisation event when the target is not the '
        + 'direct child',
    async () => {
      const tx = await blockStore.justify(
        blockHashAtZero,
        blockHashAtTwenty,
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
          blockHashAtZero,
          blockHashAtTwenty,
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
        blockHashAtTwenty,
        { from: pollingPlaceAddress },
      ),
      'The source block must first be reported.',
    );
  });

  it('should not accept an unknown target hash', async () => {
    await Utils.expectRevert(
      blockStore.justify(
        blockHashAtZero,
        unknownBlockHash,
        { from: pollingPlaceAddress },
      ),
      'The target block must first be reported.',
    );
  });

  it('should not accept a source checkpoint that is not justified', async () => {
    await Utils.expectRevert(
      blockStore.justify(
        blockHashAtTwenty,
        blockHashAtThirty,
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
          blockHashAtZero,
          blockHashAtTwentyFive,
          { from: pollingPlaceAddress },
        ),
        'The target must be at a height that is a multiple of the '
                + 'epoch length.',
      );
    },
  );

  it('should not accept a target block that has a height lower than the head', async () => {
    await blockStore.justify(
      blockHashAtZero,
      blockHashAtTen,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      blockHashAtTen,
      blockHashAtTwenty,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      blockHashAtTwenty,
      blockHashAtThirty,
      { from: pollingPlaceAddress },
    );

    await Utils.expectRevert(
      blockStore.justify(
        blockHashAtTen,
        blockHashAtTwenty,
        { from: pollingPlaceAddress },
      ),
      'The target must be higher than the head.',
    );
  });

  it('should not allow the target to be below the source', async () => {
    await blockStore.justify(
      blockHashAtZero,
      blockHashAtTwenty,
      { from: pollingPlaceAddress },
    );
    await Utils.expectRevert(
      blockStore.justify(
        blockHashAtTwenty,
        blockHashAtTen,
        { from: pollingPlaceAddress },
      ),
      'The target must be above the source in height.',
    );
  });

  it('should not allow the target to be justified with a different source', async () => {
    await blockStore.justify(
      blockHashAtZero,
      blockHashAtTen,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      blockHashAtTen,
      blockHashAtTwenty,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      blockHashAtTwenty,
      blockHashAtThirty,
      { from: pollingPlaceAddress },
    );
    await blockStore.justify(
      blockHashAtTwenty,
      blockHashAtFourty,
      { from: pollingPlaceAddress },
    );

    await Utils.expectRevert(
      blockStore.justify(
        blockHashAtThirty,
        blockHashAtFourty,
        { from: pollingPlaceAddress },
      ),
      'The target must not be justified already.',
    );
  });
});
