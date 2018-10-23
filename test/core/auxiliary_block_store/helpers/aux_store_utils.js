// Copyright 2018 OpenST Ltd.
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

const MetaBlock = require('../../../test_lib/meta_block.js');

const AuxStoreUtils = function() {};

AuxStoreUtils.prototype = {
    /**
     * Reports all given blocks on the given block store.
     *
     * @param {BlockStore} blockStore The block store where to report to.
     * @param {object} blocks A mapping of block height to block data.
     */
    reportBlocks: async (blockStore, blocks) => {
        for (let i in blocks) {
            let block = blocks[i];
            await blockStore.reportBlock(block.header);
        }
    },

    /**
     * Asserts all given votes to be valid on the given block store.
     *
     * @param {BlockStore} blockStore Where to validate the votes.
     * @param {string} coreIdentifier The core identifier of the votes.
     * @param {object} votes An array of valid vote objects.
     */
    testValidVotes: async (blockStore, coreIdentifier, votes) => {
        let count = votes.length;
        for (let i = 0; i < count; i++) {
            let vote = votes[i];

            let isValid = await blockStore.isVoteValid.call(
                MetaBlock.hashOriginTransition(
                    {
                        dynasty: vote.dynasty,
                        blockHash: vote.source,
                        coreIdentifier: coreIdentifier,
                    }
                ),
                vote.source,
                vote.target,
            );
            assert(
                isValid,
                'Vote expected to be valid; instead it was not.',
            );
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
        let subset = {};
        for (let i = start; i <= end; i++) {
            subset[i] = data[i];
        }

        return subset;
    },
};

module.exports = new AuxStoreUtils();
