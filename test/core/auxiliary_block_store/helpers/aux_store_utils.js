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
const web3 = require('../../../test_lib/web3.js');
const Utils = require('../../../test_lib/utils.js');

const MetaBlock = require('../../../test_lib/meta_block.js');

const AuxStoreUtils = function () {};

AuxStoreUtils.prototype = {
  /**
   * Calculates the accumulated transaction root from an accumulated
   * transaction root and a new one.
   *
   * @param {string} oldAccumulatedTxRoot The accumulated transaction root so
   *                                      far.
   * @param {string} newTxRoot The new transaction root to add.
   *
   * @returns {string} The new accumulated transaction root that includes the
   *                   new transaction root.
   */
  accumulateTransactionRoot: (oldAccumulatedTxRoot, newTxRoot) => web3.utils.sha3(
    web3.eth.abi.encodeParameters(
      ['bytes32', 'bytes32'],
      [oldAccumulatedTxRoot, newTxRoot],
    ),
  ),

  /**
   * Reports all given blocks on the given block store.
   *
   * @param {BlockStore} blockStore The block store where to report to.
   * @param {object} blocks A mapping of block height to block data.
   */
  reportBlocks: async (blockStore, blocks) => {
    for (const i in blocks) {
      const block = blocks[i];
      await blockStore.reportBlock(block.header);
    }
  },

  /**
   * Asserts all given votes to be valid on the given block store.
   *
   * @param {BlockStore} blockStore Where to validate the votes.
   * @param {string} coreIdentifier The core identifier of the votes.
   * @param {object} votes An array of valid vote objects.
   * @param {string} kernel hash.
   */
  testValidVotes: async (blockStore, coreIdentifier, votes, kernelHash) => {
    const count = votes.length;

    for (let i = 0; i < count; i++) {
      const vote = votes[i];

      const transition = {
        coreIdentifier,
        kernelHash,
        auxiliaryDynasty: vote.dynasty,
        auxiliaryBlockHash: vote.source,
        gas: vote.accumulatedGas,
        originDynasty: new BN('0'),
        originBlockHash: Utils.ZERO_BYTES32,
        transactionRoot: vote.accumulatedTransactionRoot,
      };

      const isValid = await blockStore.isVoteValid.call(
        MetaBlock.hashAuxiliaryTransition(transition),
        vote.source,
        vote.target,
      );
      assert(isValid, 'Vote expected to be valid; instead it was not.');
    }
  },

  /**
   * Returns an object that has the values from start to end of the given
   * data (inclusive).
   * That means that, given a blocks object, the heights of the blocks are
   * still the indices, but only a subset of heights is returned.
   *
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @param {object} data The data where to take the subset from.
   *
   * @return {object} An object that keeps the original indices and values,
   *                  but only from start to end (inclusive).
   */
  getSubset: (start, end, data) => {
    const subset = {};
    for (let i = start; i <= end; i++) {
      subset[i] = data[i];
    }

    return subset;
  },
};

module.exports = new AuxStoreUtils();
