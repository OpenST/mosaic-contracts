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
const Utils = require('../../test_lib/utils.js');

const BlockStore = artifacts.require('BlockStore');

contract('BlockStore.stateRoot()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const epochLength = new BN('10');
  const pollingPlaceAddress = accounts[0];
  const startingHeight = new BN('10');

  let blockStore;

  let blockHeaderRlpAtTen;
  let blockHashAtTen;
  let stateRootAtTen;
  let blockHeaderRlpAtTwenty;
  let blockHeaderRlpAtThirty;
  let blockHashAtThirty;
  let stateRootAtThirty;
  let blockHeaderRlpAtFourty;
  let blockHashAtFourty;

  beforeEach(async () => {
    blockHeaderRlpAtTen = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e018a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830200000a832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtTen = '0xccfa807576d1718924e23c58d0237b25b582942a593034dfff1fef59f2f110db';
    stateRootAtTen = '0xef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e018';
    blockHeaderRlpAtTwenty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e019a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000014832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHeaderRlpAtThirty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e01aa05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830200001e832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtThirty = '0xdcb96f7dd3a0e3eec7654d0bcaa8dc6d9e5ac6312a36947faf3f8b251274c75f';
    stateRootAtThirty = '0xef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e01a';
    blockHeaderRlpAtFourty = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e01ba05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000028832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtFourty = '0x6c6180d278196f95ed052fb232446dac18ecacda19ec8e471d2702fab277bdc8';

    blockStore = await BlockStore.new(
      coreIdentifier,
      epochLength,
      pollingPlaceAddress,
      blockHashAtTen,
      stateRootAtTen,
      startingHeight,
    );

    await blockStore.reportBlock(blockHeaderRlpAtTen);
    await blockStore.reportBlock(blockHeaderRlpAtTwenty);
    await blockStore.reportBlock(blockHeaderRlpAtThirty);
    await blockStore.reportBlock(blockHeaderRlpAtFourty);
  });

  it('should return a known state root', async () => {
    await blockStore.justify(blockHashAtTen, blockHashAtThirty);
    await blockStore.justify(blockHashAtThirty, blockHashAtFourty);

    const testData = [
      { height: new BN('10'), expectedStateRoot: stateRootAtTen },
      { height: new BN('30'), expectedStateRoot: stateRootAtThirty },
    ];

    const count = testData.length;
    for (let i = 0; i < count; i++) {
      const testDate = testData[i];

      const stateRoot = await blockStore.stateRoot.call(testDate.height);
      assert.strictEqual(
        stateRoot,
        testDate.expectedStateRoot,
        `The state root was not returned as expected at height ${
          testDate.height
        }`,
      );
    }
  });

  it('should fail when the height exceeds the latest finalised checkpoint', async () => {
    await blockStore.justify(blockHashAtTen, blockHashAtThirty);
    await blockStore.justify(blockHashAtThirty, blockHashAtFourty);

    // Height 40 is justified, but not finalised.
    await Utils.expectRevert(
      blockStore.stateRoot.call(new BN('40')),
      'The state root is only known up to the height of the last '
        + 'finalised checkpoint.',
    );

    // Height 50 was never reported.
    await Utils.expectRevert(
      blockStore.stateRoot.call(new BN('50')),
      'The state root is only known up to the height of the last '
        + 'finalised checkpoint.',
    );
  });

  it('should fail when the height is lower than the starting height', async () => {
    await blockStore.justify(blockHashAtTen, blockHashAtThirty);
    await blockStore.justify(blockHashAtThirty, blockHashAtFourty);

    // The starting height is 10.
    await Utils.expectRevert(
      blockStore.stateRoot.call(new BN('0')),
      'The state root is only known from the starting height upwards.',
    );
  });

  it('should fail when the block at the given height was not reported', async () => {
    await blockStore.justify(blockHashAtTen, blockHashAtThirty);
    await blockStore.justify(blockHashAtThirty, blockHashAtFourty);

    // The starting height is 10.
    await Utils.expectRevert(
      blockStore.stateRoot.call(new BN('20')),
      'State roots are only known for heights at justified checkpoints.',
    );
  });

  it('should fail when the checkpoint at the given height was not justified', async () => {
    await blockStore.justify(blockHashAtTen, blockHashAtThirty);
    await blockStore.justify(blockHashAtThirty, blockHashAtFourty);

    // The starting height is 10.
    await Utils.expectRevert(
      blockStore.stateRoot.call(new BN('20')),
      'State roots are only known for heights at justified checkpoints.',
    );
  });
});
