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

const BlockStore = artifacts.require('BlockStore');
const Utils = require('../../test_lib/utils.js');
const MetaBlockUtils = require('../../test_lib/meta_block.js');

contract('BlockStore.transitionHashAtBlock()', async (accounts) => {
  const coreIdentifier = '0x0000000000000000000000000000000000000001';
  const epochLength = new BN('10');
  const pollingPlaceAddress = accounts[0];
  const startingHeight = new BN('10');

  let blockStore;

  let blockHeaderRlpAtTen;
  let blockHashAtTen;
  let stateRootAtTen;

  beforeEach(async () => {
    blockHeaderRlpAtTen = '0xf901f9a083cafc574e1f51ba9dc0568fc617a08ea2429fb384059c972f13b19fa1c8dd55a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347948888f1f195afa192cfee860698584c030f4c9db1a0ef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e018a05fe50b260da6308036625b850b5d6ced6d0a9f814c0688bc91ffb7b7a3a54b67a0bc37d79753ad738a6dac4921e57392f145d8887476de3f783dfa7edae9283e52b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000830200000a832fefd8825208845506eb0780a0bd4472abb6659ebe3ee06ee4d7b72a00a9f4d001caca51342001075469aff49888a13a5a8c8f2bb1c4';
    blockHashAtTen = '0xccfa807576d1718924e23c58d0237b25b582942a593034dfff1fef59f2f110db';
    stateRootAtTen = '0xef1552a40b7165c3cd773806b9e0c165b75356e0314bf0706f279c729f51e018';

    blockStore = await BlockStore.new(
      coreIdentifier,
      epochLength,
      pollingPlaceAddress,
      blockHashAtTen,
      stateRootAtTen,
      startingHeight,
    );

    await blockStore.reportBlock(blockHeaderRlpAtTen);
  });

  it(
    'should return origin transition hash at given block Hash if'
      + ' checkpoint is defined',
    async () => {
      const transitionObject = {
        dynasty: 0,
        blockHash: blockHashAtTen,
        coreIdentifier,
      };

      const expectedTransitionHash = MetaBlockUtils.hashOriginTransition(
        transitionObject,
      );

      const transitionHash = await blockStore.transitionHashAtBlock.call(
        blockHashAtTen,
      );

      assert.strictEqual(
        transitionHash,
        expectedTransitionHash,
        'Transition hash is different from expected transition hash.',
      );
    },
  );

  it('should fail if checkpoint is not defined at given block hash.', async () => {
    const wrongBlockHash = web3.utils.sha3('wrong block hash');

    await Utils.expectRevert(
      blockStore.transitionHashAtBlock.call(wrongBlockHash),
      'Checkpoint not defined for given block hash.',
    );
  });
});
