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
const MetaBlock = require('../../test_lib/meta_block.js');

const BlockStore = artifacts.require('BlockStore');

contract('BlockStore.isVoteValid()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const epochLength = new BN('10');
  const pollingPlaceAddress = accounts[0];
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
      blockHashAtZero,
      initialStateRoot,
      initialHeight,
    );

    await blockStore.reportBlock(blockHeaderRlpAtTen);
    await blockStore.reportBlock(blockHeaderRlpAtTwenty);
    await blockStore.reportBlock(blockHeaderRlpAtThirty);
    await blockStore.reportBlock(blockHeaderRlpAtFourty);

    await blockStore.reportBlock(blockHeaderRlpAtTwentyFive);
  });

  it('should return true for valid votes', async () => {
    let isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('0'),
          blockHash: blockHashAtZero,
          coreIdentifier,
        },
      ),
      blockHashAtZero,
      blockHashAtTen,
    );
    assert(
      isValid,
      'Vote expected to be valid; instead it was not.',
    );

    isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('0'),
          blockHash: blockHashAtZero,
          coreIdentifier,
        },
      ),
      blockHashAtZero,
      blockHashAtTwenty,
    );
    assert(
      isValid,
      'Vote expected to be valid; instead it was not.',
    );

    isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('0'),
          blockHash: blockHashAtZero,
          coreIdentifier,
        },
      ),
      blockHashAtZero,
      blockHashAtFourty,
    );
    assert(
      isValid,
      'Vote expected to be valid; instead it was not.',
    );

    await blockStore.justify(blockHashAtZero, blockHashAtTwenty);

    isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('1'),
          blockHash: blockHashAtTwenty,
          coreIdentifier,
        },
      ),
      blockHashAtTwenty,
      blockHashAtThirty,
    );
    assert(
      isValid,
      'Vote expected to be valid; instead it was not.',
    );

    isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('1'),
          blockHash: blockHashAtTwenty,
          coreIdentifier,
        },
      ),
      blockHashAtTwenty,
      blockHashAtFourty,
    );
    assert(
      isValid,
      'Vote expected to be valid; instead it was not.',
    );

    await blockStore.justify(blockHashAtTwenty, blockHashAtThirty);

    isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('2'),
          blockHash: blockHashAtThirty,
          coreIdentifier,
        },
      ),
      blockHashAtThirty,
      blockHashAtFourty,
    );
    assert(
      isValid,
      'Vote expected to be valid; instead it was not.',
    );
  });

  it('should not accept an unknown source hash', async () => {
    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('0'),
          blockHash: unknownBlockHash,
          coreIdentifier,
        },
      ),
      unknownBlockHash,
      blockHashAtTwenty,
    );
    assert(
      !isValid,
      'Vote expected to be invalid; instead it was.',
    );
  });

  it('should not accept an unknown target hash', async () => {
    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('0'),
          blockHash: blockHashAtZero,
          coreIdentifier,
        },
      ),
      blockHashAtZero,
      unknownBlockHash,
    );
    assert(
      !isValid,
      'Vote expected to be invalid; instead it was.',
    );
  });

  it('should not accept a source checkpoint that is not justified', async () => {
    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('1'),
          blockHash: blockHashAtTwenty,
          coreIdentifier,
        },
      ),
      blockHashAtTwenty,
      blockHashAtThirty,
    );
    assert(
      !isValid,
      'Vote expected to be invalid; instead it was.',
    );
  });

  it('should not accept a target block that has a height that is not a '
        + 'multiple of the epoch length',
  async () => {
    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('0'),
          blockHash: blockHashAtZero,
          coreIdentifier,
        },
      ),
      blockHashAtZero,
      blockHashAtTwentyFive,
    );
    assert(
      !isValid,
      'Vote expected to be invalid; instead it was.',
    );
  });

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

    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('1'),
          blockHash: blockHashAtTen,
          coreIdentifier,
        },
      ),
      blockHashAtTen,
      blockHashAtTwenty,
    );
    assert(
      !isValid,
      'The target must be higher than the head.',
    );
  });

  it('should not accept an invalid transition hash', async () => {
    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('1337'),
          blockHash: blockHashAtZero,
          coreIdentifier,
        },
      ),
      blockHashAtZero,
      blockHashAtTen,
    );
    assert(
      !isValid,
      'It should not accept an invalid transition hash.',
    );
  });

  it('should not allow the target to be below the source', async () => {
    await blockStore.justify(
      blockHashAtZero,
      blockHashAtTwenty,
      { from: pollingPlaceAddress },
    );
    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('1'),
          blockHash: blockHashAtTwenty,
          coreIdentifier,
        },
      ),
      blockHashAtTwenty,
      blockHashAtTen,
    );
    assert(
      !isValid,
      'It should not accept a target below the source.',
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

    const isValid = await blockStore.isVoteValid.call(
      MetaBlock.hashOriginTransition(
        {
          dynasty: new BN('3'),
          blockHash: blockHashAtThirty,
          coreIdentifier,
        },
      ),
      blockHashAtThirty,
      blockHashAtFourty,
    );
    assert(
      !isValid,
      'The target must not be justified before.',
    );
  });
});
