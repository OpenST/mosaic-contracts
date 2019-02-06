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

contract('BlockStore.reportBlock()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const epochLength = new BN('10');
  const pollingPlaceAddress = accounts[0];
  const initialBlockHash = '0x7f1034f3d32a11c606f8ae8265344d2ab06d71500289df6f9cac2e013990830c';
  const initialStateRoot = '0xb6a85955e3671040901a17db85b121550338ad1a0071ca13d196d19df31f56ca';
  const initialHeight = new BN('0');

  let blockStore;

  let blockHeaderRlp;
  let blockHash;

  beforeEach(async () => {
    blockStore = await BlockStore.new(
      coreIdentifier,
      epochLength,
      pollingPlaceAddress,
      initialBlockHash,
      initialStateRoot,
      initialHeight,
    );

    blockHeaderRlp = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHash = '0x0a5843ac1cb04865017cb35a57b50b07084e5fcee39b5acadade33149f4fff9e';
  });

  it('should accept a valid report', async () => {
    await blockStore.reportBlock(blockHeaderRlp);

    const reported = await blockStore.isBlockReported.call(blockHash);
    assert.strictEqual(
      reported,
      true,
      'A reported block must be registered as reported.',
    );
  });

  it('should emit an event when a block is reported', async () => {
    const tx = await blockStore.reportBlock(blockHeaderRlp);

    const event = EventDecoder.perform(
      tx.receipt,
      blockStore.address,
      blockStore.abi,
    );
    assert.strictEqual(event.BlockReported.blockHash, blockHash);
  });

  it('should revert when the RLP encoding is invalid', async () => {
    const invalidEncodedHeader = '0xa901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e017a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b90100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008302000001832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';

    await Utils.expectRevert(blockStore.reportBlock(invalidEncodedHeader));
  });
});
