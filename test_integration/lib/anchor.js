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
const AnchorStateRootAssertion = require('./anchor_stateroot_assertion');
const EventDecoder = require('../../test/test_lib/event_decoder');

/**
 * This class represents anchor contract on a chain.
 */
class Anchor {
  /**
   * Constructor
   * @param {Web3} sourceWeb3 Web3 of source chain for which this anchor
   *                          tracks state root.
   * @param {Object} anchor Contract instance of anchor contract on target
   *                        chain.
   * @param {string} organization Organization address of the organization
   *                 that is responsible for anchoring the state root on
   *                 target chain.
   */
  constructor(sourceWeb3, anchor, organization) {
    this.sourceWeb3 = sourceWeb3;
    this.anchor = anchor;
    this.organization = organization;
  }

  /**
   * This anchors a state root at a given block height.
   * @param {number | string} atBlock Block at which state root needs to
   *                          anchor. Default value is latest.
   * @return {Promise<blockHeight>} Returns blockHeight at which state
   *                                root is anchored.
   */
  async anchorStateRoot(atBlock = 'latest') {
    const block = await this.sourceWeb3.eth.getBlock(atBlock);
    const blockHeight = new BN(block.number);
    const { stateRoot } = block;
    const tx = await this.anchor.anchorStateRoot(
      blockHeight,
      stateRoot,
      { from: this.organization },
    );

    const event = EventDecoder.getEvents(tx, this.anchor);
    AnchorStateRootAssertion.verify(
      event,
      blockHeight,
      stateRoot,
    );
    return block.number;
  }
}

module.exports = Anchor;
