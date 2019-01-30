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
const AssertAnchorStateRoot = require('./assert_anchor_stateroot');
const EventDecoder = require('../../../test/test_lib/event_decoder');

/**
 * This class represents anchor contract on a chain.
 */
class Anchor {
    /**
     *
     * @param sourceWeb3 Web3 of source chain for which this anchor tracks
     * state root.
     * @param anchor Contract instance of anchor contract.
     */
    constructor(sourceWeb3, anchor) {
        this.sourceWeb3 = sourceWeb3;
        this.anchor = anchor;
    }

    /**
     *
     * @param atBlock Block at which state root needs to anchor. Default
     * value is latest.
     * @param owner Address of owner, reponsible for anchor state root.
     * @return {Promise<blockHeight>} returns blockHeight at which state
     * root is anchored.
     */
    async anchorStateRoot(atBlock = 'latest', owner) {
        const block = await this.sourceWeb3.eth.getBlock(atBlock);
        const blockHeight = new BN(block.number);
        const stateRoot = block.stateRoot;

        const tx = await this.anchor.anchorStateRoot(
            blockHeight,
            stateRoot,
            { from: owner },
        );

        const event = EventDecoder.getEvents(tx, this.anchor);
        AssertAnchorStateRoot.verify(
            event,
            blockHeight,
            stateRoot,
        );
        return block.number;
    }
}

module.exports = Anchor;
