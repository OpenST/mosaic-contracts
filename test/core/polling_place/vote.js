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
const web3 = require('../../test_lib/web3.js');

const EventsDecoder = require('../../test_lib/event_decoder.js');
const MetaBlockUtils = require('../../test_lib/meta_block.js');
const Utils = require('../../test_lib/utils.js');

const MockBlockStore = artifacts.require('MockBlockStore');
const PollingPlace = artifacts.require('PollingPlace');

const VOTE_MESSAGE_TYPEHASH = web3.utils.sha3(
  'VoteMessage(bytes20 coreIdentifier,bytes32 transitionHash,bytes32 source,bytes32 target,uint256 sourceHeight,uint256 targetHeight)',
);

contract('PollingPlace.vote()', async (accounts) => {
  let pollingPlace;

  const originCoreIdentifier = '0x0000000000000000000000000000000000000001';
  let originBlockStore;
  const auxiliaryCoreIdentifier = '0x0000000000000000000000000000000000000002';
  let auxiliaryBlockStore;

  let vote;

  beforeEach(async () => {
    originBlockStore = await MockBlockStore.new();
    auxiliaryBlockStore = await MockBlockStore.new();

    await originBlockStore.setVoteValid(true);
    await auxiliaryBlockStore.setVoteValid(true);
    await originBlockStore.setCoreIdentifier(originCoreIdentifier);
    await auxiliaryBlockStore.setCoreIdentifier(auxiliaryCoreIdentifier);

    /*
     * Set up a default, valid vote to use throughout all tests.
     * Note that the transition hash etc. do not have to be valid here,
     * as the BlockStore is mocked and will return a valid response.
     *
     * Testing that the transition hash etc. need to be correct should
     * be done in the unit tests of the BlockStore.
     */
    vote = {
      coreIdentifier: originCoreIdentifier,
      transitionHash: web3.utils.sha3('transition'),
      source: '0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f983e593ac4302d38a112b',
      target: '0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9ce',
      sourceHeight: new BN('1'),
      targetHeight: new BN('2'),
    };

    pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      [accounts[0]],
      [new BN('12')],
    );
  });

  it('should accept a valid vote', async () => {
    const signature = await MetaBlockUtils.signVote(accounts[0], vote);

    await pollingPlace.vote(
      vote.coreIdentifier,
      vote.transitionHash,
      vote.source,
      vote.target,
      vote.sourceHeight,
      vote.targetHeight,
      signature.v,
      signature.r,
      signature.s,
    );
  });

  it('should not accept a vote signed by an unknown validator', async () => {
    // Signing for accounts[1], but adding accounts[0] as validator.
    const signature = await MetaBlockUtils.signVote(accounts[1], vote);

    await Utils.expectRevert(
      pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      ),
      'A vote by an unknown validator cannot be recorded.',
    );
  });

  it('should not accept a vote with invalid core identifier', async () => {
    const unknownCoreIdentifier = '0x1234500000000000000000000000000000000001';
    vote.coreIdentifier = unknownCoreIdentifier;

    const signature = await MetaBlockUtils.signVote(accounts[0], vote);

    await Utils.expectRevert(
      pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      ),
      'The provided core identifier must be known to the PollingPlace.',
    );
  });

  it('should not accept a vote with invalid heights', async () => {
    // Target height is less than source height.
    vote.targetHeight = new BN('0');

    const signature = await MetaBlockUtils.signVote(accounts[0], vote);

    await Utils.expectRevert(
      pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      ),
      'The source height must be less than the target height.',
    );
  });

  it('should not accept a vote deemed invalid by the block store', async () => {
    await originBlockStore.setVoteValid(true);
    await auxiliaryBlockStore.setVoteValid(false);

    pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      [accounts[0]],
      [new BN('12')],
    );

    // Origin block store should pass.
    vote.coreIdentifier = originCoreIdentifier;
    let signature = await MetaBlockUtils.signVote(accounts[0], vote);
    await pollingPlace.vote(
      vote.coreIdentifier,
      vote.transitionHash,
      vote.source,
      vote.target,
      vote.sourceHeight,
      vote.targetHeight,
      signature.v,
      signature.r,
      signature.s,
    );

    // Auxiliary block store should fail.
    vote.coreIdentifier = auxiliaryCoreIdentifier;
    signature = await MetaBlockUtils.signVote(accounts[0], vote);
    await Utils.expectRevert(
      pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      ),
      'The provided vote is not valid according to the block store.',
    );
  });

  it('should signal a 2/3 majority vote', async () => {
    /*
         * There is a total weight of 60. That means a voting weight of
         * >=40 is >=2/3 of the total weight.
         */
    const expectedWeights = {
      addresses: [
        accounts[0],
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
        accounts[5],
        accounts[6],
        accounts[7],
        accounts[8],
        accounts[9],
      ],
      values: [
        new BN('2'),
        new BN('3'),
        new BN('4'),
        new BN('5'),
        new BN('6'),
        new BN('6'),
        new BN('7'),
        new BN('8'),
        new BN('9'),
        new BN('10'),
      ],
    };

    pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      expectedWeights.addresses,
      expectedWeights.values,
    );

    /*
     * All first 8 validators must vote to achieve a 2/3 majority. So
     * for the first 7 there should not be a justification event.
     */
    for (let i = 0; i < 7; i += 1) {
      const signature = await MetaBlockUtils.signVote(expectedWeights.addresses[i], vote);
      const tx = await pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      );

      let events = EventsDecoder.perform(
        tx.receipt,
        originBlockStore.address,
        originBlockStore.abi,
      );

      assert.strictEqual(
        events.Justified,
        undefined,
        'There should not be a Justify event emitted by the origin block store.',
      );
      events = EventsDecoder.perform(
        tx.receipt,
        auxiliaryBlockStore.address,
        auxiliaryBlockStore.abi,
      );

      assert.strictEqual(
        events.Justified,
        undefined,
        'There should not be a Justify event emitted by the auxiliary block store.',
      );
    }

    /*
     * The eighth vote should trigger the expected event as a 2/3
     * majority is reached
     */
    const signature = await MetaBlockUtils.signVote(expectedWeights.addresses[7], vote);
    const tx = await pollingPlace.vote(
      vote.coreIdentifier,
      vote.transitionHash,
      vote.source,
      vote.target,
      vote.sourceHeight,
      vote.targetHeight,
      signature.v,
      signature.r,
      signature.s,
    );

    let events = EventsDecoder.perform(
      tx.receipt,
      originBlockStore.address,
      originBlockStore.abi,
    );

    assert.strictEqual(
      events.Justified._source,
      vote.source,
      'There should be a Justify event with the source emitted by the origin block store.',
    );
    assert.strictEqual(
      events.Justified._target,
      vote.target,
      'There should be a Justify event with the target emitted by the origin block store.',
    );
    // The auxiliary block store should still not emit an event.
    events = EventsDecoder.perform(
      tx.receipt,
      auxiliaryBlockStore.address,
      auxiliaryBlockStore.abi,
    );

    assert.strictEqual(
      events.Justified,
      undefined,
      'There should not be a Justify event emitted by the auxiliary block store.',
    );
  });

  it('should not achieve a majority by combining core ids', async () => {
    /*
     * There is a total weight of 60. That means a voting weight of
     * >=40 is >=2/3 of the total weight.
     */
    const expectedWeights = {
      addresses: [
        accounts[0],
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
        accounts[5],
        accounts[6],
        accounts[7],
        accounts[8],
        accounts[9],
      ],
      values: [
        new BN('2'),
        new BN('3'),
        new BN('4'),
        new BN('5'),
        new BN('6'),
        new BN('6'),
        new BN('7'),
        new BN('8'),
        new BN('9'),
        new BN('10'),
      ],
    };

    pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      expectedWeights.addresses,
      expectedWeights.values,
    );

    /*
     * By splitting the votes across both core identifiers' respective
     * block stores, a >=2/3 majority should not be reached on either.
     */
    const coreIdentifiers = [
      originCoreIdentifier,
      auxiliaryCoreIdentifier,
    ];
    for (let i = 0; i < 10; i += 1) {
      // Alternate core identifiers to split the votes
      const coreIdentifier = coreIdentifiers[i % 2];
      vote.coreIdentifier = coreIdentifier;

      const signature = await MetaBlockUtils.signVote(expectedWeights.addresses[i], vote);
      const tx = await pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      );

      let events = EventsDecoder.perform(
        tx.receipt,
        originBlockStore.address,
        originBlockStore.abi,
      );

      assert.strictEqual(
        events.Justified,
        undefined,
        'There should not be a Justify event emitted by the origin block store.',
      );

      events = EventsDecoder.perform(
        tx.receipt,
        auxiliaryBlockStore.address,
        auxiliaryBlockStore.abi,
      );

      assert.strictEqual(
        events.Justified,
        undefined,
        'There should not be a Justify event emitted by the auxiliary block store.',
      );
    }
  });

  it(
    'should not achieve a majority by combining different source or target hashes',
    async () => {
      /*
       * There is a total weight of 60. That means a voting weight of
       * >=40 is >=2/3 of the total weight.
       */
      const expectedWeights = {
        addresses: [
          accounts[0],
          accounts[1],
          accounts[2],
          accounts[3],
          accounts[4],
          accounts[5],
          accounts[6],
          accounts[7],
          accounts[8],
          accounts[9],
        ],
        values: [
          new BN('2'),
          new BN('3'),
          new BN('4'),
          new BN('5'),
          new BN('6'),
          new BN('6'),
          new BN('7'),
          new BN('8'),
          new BN('9'),
          new BN('10'),
        ],
      };

      pollingPlace = await PollingPlace.new(
        originBlockStore.address,
        auxiliaryBlockStore.address,
        expectedWeights.addresses,
        expectedWeights.values,
      );

      for (let i = 0; i < 10; i += 1) {
        // Incrementing source hashes to split the votes
        vote.source = `${'0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f9'
                    + '83e593ac4302d38a112'}${i.toString(16)}`;

        const signature = await MetaBlockUtils.signVote(
          expectedWeights.addresses[i],
          vote,
        );
        const tx = await pollingPlace.vote(
          vote.coreIdentifier,
          vote.transitionHash,
          vote.source,
          vote.target,
          vote.sourceHeight,
          vote.targetHeight,
          signature.v,
          signature.r,
          signature.s,
        );

        let events = EventsDecoder.perform(
          tx.receipt,
          originBlockStore.address,
          originBlockStore.abi,
        );
        assert.strictEqual(
          events.Justified,
          undefined,
          'There should not be a Justify event emitted by the origin block store.',
        );

        events = EventsDecoder.perform(
          tx.receipt,
          auxiliaryBlockStore.address,
          auxiliaryBlockStore.abi,
        );
        assert.strictEqual(
          events.Justified,
          undefined,
          'There should not be a Justify event emitted by the auxiliary block store.',
        );
      }
      for (let i = 0; i < 10; i += 1) {
        /*
         * New target height as validators are not allowed to vote on
         * the same height from the previous loop again.
         */
        vote.targetHeight = new BN('999');
        // Incrementing target hashes to split the votes
        vote.target = `${'0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9c'}`
          + `${i.toString(16)}`;

        const signature = await MetaBlockUtils.signVote(
          expectedWeights.addresses[i],
          vote,
        );
        const tx = await pollingPlace.vote(
          vote.coreIdentifier,
          vote.transitionHash,
          vote.source,
          vote.target,
          vote.sourceHeight,
          vote.targetHeight,
          signature.v,
          signature.r,
          signature.s,
        );

        let events = EventsDecoder.perform(
          tx.receipt,
          originBlockStore.address,
          originBlockStore.abi,
        );
        assert.strictEqual(
          events.Justified,
          undefined,
          'There should not be a Justify event emitted by the origin block store.',
        );

        events = EventsDecoder.perform(
          tx.receipt,
          auxiliaryBlockStore.address,
          auxiliaryBlockStore.abi,
        );
        assert.strictEqual(
          events.Justified,
          undefined,
          'There should not be a Justify event emitted by the auxiliary block store.',
        );
      }
    },
  );

  it('should not have a rounding error to achieve 2/3 majority', async () => {
    /*
     * There is a total weight of **61**. That means a voting weight of
     * >=41 is >=2/3 of the total weight.
     * A rounding error could lead to a requirement of
     * `61 * 2 / 3 = 40` (rounding down when dividing).
     */
    const expectedWeights = {
      addresses: [
        accounts[0],
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
        accounts[5],
        accounts[6],
        accounts[7],
        accounts[8],
        accounts[9],
      ],
      values: [
        new BN('5'),
        new BN('5'),
        new BN('5'),
        new BN('5'),
        new BN('5'),
        new BN('5'),
        new BN('5'),
        new BN('5'),
        new BN('10'),
        new BN('11'),
      ],
    };

    pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      expectedWeights.addresses,
      expectedWeights.values,
    );

    // The first 8 validators will validate 40 of 61 weight.
    for (let i = 0; i < 8; i += 1) {
      const signature = await MetaBlockUtils.signVote(expectedWeights.addresses[i], vote);
      const tx = await pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      );

      let events = EventsDecoder.perform(
        tx.receipt,
        originBlockStore.address,
        originBlockStore.abi,
      );
      assert.strictEqual(
        events.Justified,
        undefined,
        'There should not be a Justify event emitted by the origin block store.',
      );

      events = EventsDecoder.perform(
        tx.receipt,
        auxiliaryBlockStore.address,
        auxiliaryBlockStore.abi,
      );
      assert.strictEqual(
        events.Justified,
        undefined,
        'There should not be a Justify event emitted by the auxiliary block store.',
      );
    }
  });

  it('should not count the same validator more than once on the same target', async () => {
    const expectedWeights = {
      addresses: [
        accounts[0],
        accounts[1],
      ],
      values: [
        new BN('1'),
        new BN('9'),
      ],
    };

    pollingPlace = await PollingPlace.new(
      originBlockStore.address,
      auxiliaryBlockStore.address,
      expectedWeights.addresses,
      expectedWeights.values,
    );

    /*
     * Letting the first validator vote multiple times on the same
     * target should lead to a revert.
     */
    vote.sourceHeight = new BN('5');
    vote.targetHeight = new BN('15');
    let signature = await MetaBlockUtils.signVote(accounts[0], vote);
    await pollingPlace.vote(
      vote.coreIdentifier,
      vote.transitionHash,
      vote.source,
      vote.target,
      vote.sourceHeight,
      vote.targetHeight,
      signature.v,
      signature.r,
      signature.s,
    );

    // Even with a different source.
    vote.sourceHeight = new BN('8');
    signature = await MetaBlockUtils.signVote(accounts[0], vote);
    await Utils.expectRevert(
      pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      ),
      'A validator must vote for increasing target heights.',
    );
  });

  it('should accept a vote for a target height greater than open meta-block', async () => {
    await auxiliaryBlockStore.setPollingPlace(pollingPlace.address);
    await auxiliaryBlockStore.updateMetaBlock(
      [],
      [],
      new BN('19850912'),
      new BN('19850912'),
    );

    vote.targetHeight = new BN('19891109');
    const signature = await MetaBlockUtils.signVote(accounts[0], vote);

    await pollingPlace.vote(
      vote.coreIdentifier,
      vote.transitionHash,
      vote.source,
      vote.target,
      vote.sourceHeight,
      vote.targetHeight,
      signature.v,
      signature.r,
      signature.s,
    );
  });

  it('should not accept a vote for a target height less than open meta-block', async () => {
    await auxiliaryBlockStore.setPollingPlace(pollingPlace.address);
    await auxiliaryBlockStore.updateMetaBlock(
      [],
      [],
      new BN('19891109'),
      new BN('19891109'),
    );

    vote.targetHeight = new BN('19851209');
    const signature = await MetaBlockUtils.signVote(accounts[0], vote);

    await Utils.expectRevert(
      pollingPlace.vote(
        vote.coreIdentifier,
        vote.transitionHash,
        vote.source,
        vote.target,
        vote.sourceHeight,
        vote.targetHeight,
        signature.v,
        signature.r,
        signature.s,
      ),
      'The target height must be within the currently open meta-block.',
    );
  });
});
