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
// Test: PollingPlace.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const web3 = require('../test_lib/web3.js');

const BN = require('bn.js');
const EventsDecoder = require('../test_lib/event_decoder.js');
const Utils = require('../test_lib/utils.js');

const BlockStoreMock = artifacts.require('BlockStoreMock');
const PollingPlace = artifacts.require('PollingPlace');

const ValidatorIndexAuxiliaryAddress = 0;
const ValidatorIndexWeight = 1;
const ValidatorIndexEnded = 2;
const ValidatorIndexStartHeight = 3;
const ValidatorIndexEndHeight = 4;

contract('PollingPlace', async (accounts) => {
    /*
     * Make the first address the default meta-block gate to be able to
     * call methods that change the set of validators from the default
     * message caller address.
     */
    let metaBlockGate = accounts[0];
    let originCoreIdentifier = '0x0000000000000000000000000000000000000001';
    let originBlockStore;
    let auxiliaryCoreIdentifier = '0x0000000000000000000000000000000000000002';
    let auxiliaryBlockStore;

    beforeEach(async () => {
        originBlockStore = await BlockStoreMock.new();
        auxiliaryBlockStore = await BlockStoreMock.new();

        await originBlockStore.setVoteValid(true);
        await auxiliaryBlockStore.setVoteValid(true);
    });

    describe('deploying a polling place contract', async () => {

        it('should store a correct list of initial validators', async () => {
            let expectedWeights = {
                addresses: [
                    '0x0000000000000000000000000000000000000001',
                    '0x0000000000000000000000000000000000000002',
                    '0x0000000000000000000000000000000000000003',
                    '0x0000000000000000000000000000000000000004',
                    '0x0000000000000000000000000000000000000005',
                    '0x0000000000000000000000000000000000000006',
                    '0x0000000000000000000000000000000000000007',
                    '0x0000000000000000000000000000000000000008',
                    '0x0000000000000000000000000000000000000009',
                    web3.utils.toChecksumAddress('0x000000000000000000000000000000000000000a'),
                    web3.utils.toChecksumAddress('0x000000000000000000000000000000000000000b'),
                    web3.utils.toChecksumAddress('0x000000000000000000000000000000000000000c'),
                    web3.utils.toChecksumAddress('0x000000000000000000000000000000000000000d'),
                    web3.utils.toChecksumAddress('0x000000000000000000000000000000000000000e'),
                    web3.utils.toChecksumAddress('0x000000000000000000000000000000000000000f'),
                    '0x0000000000000000000000000000000000000010',
                    '0x0000000000000000000000000000000000000011',
                    '0x0000000000000000000000000000000000000012',
                    '0x0000000000000000000000000000000000000013',
                ],
                values: [
                    new BN('1'),
                    new BN('2'),
                    new BN('3'),
                    new BN('4'),
                    new BN('5'),
                    new BN('6'),
                    new BN('7'),
                    new BN('8'),
                    new BN('9'),
                    new BN('10'),
                    new BN('11'),
                    new BN('12'),
                    new BN('13'),
                    new BN('14'),
                    new BN('15'),
                    new BN('16'),
                    new BN('17'),
                    new BN('18'),
                    new BN('19'),
                ]
            };

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                expectedWeights.addresses,
                expectedWeights.values
            );

            let storedMetaBlockGate = await pollingPlace.metaBlockGate.call();
            assert.strictEqual(
                storedMetaBlockGate,
                metaBlockGate,
                'The contract must store the correct meta-block gate.'
            );

            // Check for all individual weights to be recorded
            for (var i = 0; i < 19; i++) {
                let validator = await pollingPlace.validators.call(expectedWeights.addresses[i]);

                assert.strictEqual(
                    validator[ValidatorIndexAuxiliaryAddress],
                    expectedWeights.addresses[i],
                    'The contract must record the correct auxilary address of a validator.'
                );
                assert(
                    validator[ValidatorIndexStake].eq(expectedWeights.values[i]),
                    'The contract must record the correct staking value address of a validator.'
                );
                assert.strictEqual(
                    validator[ValidatorIndexEnded],
                    false,
                    'The contract must record that a validator hasn\'t ended on construction.'
                );
                assert(
                    validator[ValidatorIndexStartHeight].eq(new BN('0')),
                    'The contract must record a zero starting height at construction.'
                );
                assert(
                    validator[ValidatorIndexEndHeight].eq(new BN('0')),
                    'The contract must record a zero ending height at construction.'
                );
            }

            let totalWeightAtZero = await pollingPlace.totalWeights.call(0);
            assert(
                totalWeightAtZero.eq(new BN('190')),
                'The contract must track the sum of all stakes as total stakes.'
            );
        });

        it('should not accept a zero meta-block gate', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    '0x0000000000000000000000000000000000000000',
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('2'),
                    ]
                )
            );
        });

        it('should not accept a zero origin core id', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    '0x0000000000000000000000000000000000000000',
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('2'),
                    ]
                )
            );
        });

        it('should not accept a zero origin block store', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    '0x0000000000000000000000000000000000000000',
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('2'),
                    ]
                )
            );
        });

        it('should not accept a zero auxiliary core id', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    '0x0000000000000000000000000000000000000000',
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('2'),
                    ]
                )
            );
        });

        it('should not accept a zero auxiliary block store', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    '0x0000000000000000000000000000000000000000',
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BN('1'),
                        new BN('2'),
                    ]
                )
            );
        });

        it('should not accept an empty validator set', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [],
                    []
                )
            );
        });

        it('should not accept two arrays of different length', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BN('1'),
                    ]
                )
            );

            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('1'),
                    ]
                )
            );
        });

        it('should not accept a zero weight', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BN('1'),
                        new BN('0'),
                    ]
                )
            );
        });

        it('should not accept a zero address', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000000',
                    ],
                    [
                        new BN('1'),
                        new BN('2'),
                    ]
                )
            );
        });

        it('should not accept the same address more than once', async () => {
            await Utils.expectRevert(
                PollingPlace.new(
                    metaBlockGate,
                    originCoreIdentifier,
                    originBlockStore.address,
                    auxiliaryCoreIdentifier,
                    auxiliaryBlockStore.address,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                        '0x0000000000000000000000000000000000000001',
                    ],
                    [
                        new BN('1'),
                        new BN('2'),
                        new BN('3'),
                    ]
                )
            );
        })
    });

    describe('casting a vote', async () => {

        let vote;

        beforeEach(async () => {
            /*
             * Set up a default, valid vote to use throughout all tests.
             * Note that the transition hash etc. do not have to be valid here,
             * as the BlockStore is mocked and will return a valid response.
             * 
             * Testing that the transition hash etc. need to be correct sould
             * be done in the unit tests of the BlockStore.
             */
            vote = {
                coreIdentifier: originCoreIdentifier,
                transitionHash: web3.sha3('transition'),
                source: '0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f983e593ac4302d38a112b',
                target: '0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9ce',
                sourceHeight: new BigNumber('1'),
                targetHeight: new BigNumber('2'),
            };
        });

        it('should accept a valid vote', async () => {

            let signature = await signVote(accounts[0], vote);

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                [accounts[0]],
                [new BigNumber('12')],
            );

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
            let signature = await signVote(accounts[1], vote);

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                [accounts[0]],
                [new BigNumber('12')],
            );

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
                )
            );
        });

        it('should not accept a vote with invalid core identifier', async () => {
            let unknownCoreIdentifier = '0x1234500000000000000000000000000000000001';
            vote.coreIdentifier = unknownCoreIdentifier;

            let signature = await signVote(accounts[0], vote);

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                [accounts[0]],
                [new BigNumber('12')],
            );

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
                )
            );
        });

        it('should not accept a vote with invalid heights', async () => {
            // Target height is less than source height.
            vote.targetHeight = new BigNumber('0');

            let signature = await signVote(accounts[0], vote);

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                [accounts[0]],
                [new BigNumber('12')],
            );

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
                )
            );
        });

        it('should not accept a vote deemed invalid by the block store', async () => {
            await originBlockStore.setVoteValid(true);
            await auxiliaryBlockStore.setVoteValid(false);

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                [accounts[0]],
                [new BigNumber('12')],
            );

            // Origin block store should pass.
            vote.coreIdentifier = originCoreIdentifier;
            let signature = await signVote(accounts[0], vote);
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
            signature = await signVote(accounts[0], vote);
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
                )
            );
        });

        it('should signal a 2/3 majority vote', async () => {
            /*
             * There is a total weight of 60. That means a voting weight of
             * >=40 is >=2/3 of the total weight.
             */
            let expectedWeights = {
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
                    new BigNumber('2'),
                    new BigNumber('3'),
                    new BigNumber('4'),
                    new BigNumber('5'),
                    new BigNumber('6'),
                    new BigNumber('6'),
                    new BigNumber('7'),
                    new BigNumber('8'),
                    new BigNumber('9'),
                    new BigNumber('10'),
                ]
            };

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                expectedWeights.addresses,
                expectedWeights.values
            );

            /*
             * All first 8 validators must vote to achieve a 2/3 majority. So
             * for the first 7 there should not be a justification event.
             */
            for (var i = 0; i < 7; i++) {
                let signature = await signVote(expectedWeights.addresses[i], vote);
                let tx = await pollingPlace.vote(
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

                let events = EventsDecoder.perform(tx.receipt, originBlockStore.address, originBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the origin block store.'
                );
                events = EventsDecoder.perform(tx.receipt, auxiliaryBlockStore.address, auxiliaryBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the auxiliary block store.'
                );
            }

            /*
             * The eighth vote sohuld trigger the expected event as a 2/3
             * majority is reached
             */
            let signature = await signVote(expectedWeights.addresses[7], vote);
            let tx = await pollingPlace.vote(
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

            let events = EventsDecoder.perform(tx.receipt, originBlockStore.address, originBlockStore.abi);
            assert.strictEqual(
                events.Justified['_source'],
                vote.source,
                'There should be a Justify event with the source emitted by the origin block store.'
            );
            assert.strictEqual(
                events.Justified['_target'],
                vote.target,
                'There should be a Justify event with the target emitted by the origin block store.'
            );
            // The auxiliary block store should still not emit an event.
            events = EventsDecoder.perform(tx.receipt, auxiliaryBlockStore.address, auxiliaryBlockStore.abi);
            assert.strictEqual(
                events.Justified,
                undefined,
                'There should not be a Justify event emitted by the auxiliary block store.'
            );
        });

        it('should not achieve a majority by combining core ids', async () => {
            /*
             * There is a total weight of 60. That means a voting weight of
             * >=40 is >=2/3 of the total weight.
             */
            let expectedWeights = {
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
                    new BigNumber('2'),
                    new BigNumber('3'),
                    new BigNumber('4'),
                    new BigNumber('5'),
                    new BigNumber('6'),
                    new BigNumber('6'),
                    new BigNumber('7'),
                    new BigNumber('8'),
                    new BigNumber('9'),
                    new BigNumber('10'),
                ]
            };

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                expectedWeights.addresses,
                expectedWeights.values
            );

            /*
             * By splitting the votes across both core identifiers' respective
             * block stores, a >=2/3 majority should not be reached on either.
             */
            let coreIdentifiers = [
                originCoreIdentifier,
                auxiliaryCoreIdentifier,
            ];
            for (var i = 0; i < 10; i++) {
                // Alternate core identifiers to split the votes
                let coreIdentifier = coreIdentifiers[i % 2];
                vote.coreIdentifier = coreIdentifier;

                let signature = await signVote(expectedWeights.addresses[i], vote);
                let tx = await pollingPlace.vote(
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

                let events = EventsDecoder.perform(tx.receipt, originBlockStore.address, originBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the origin block store.'
                );
                events = EventsDecoder.perform(tx.receipt, auxiliaryBlockStore.address, auxiliaryBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the auxiliary block store.'
                );
            }
        });

        it('should not achieve a majority by combining different source or target hashes', async () => {
            /*
             * There is a total weight of 60. That means a voting weight of
             * >=40 is >=2/3 of the total weight.
             */
            let expectedWeights = {
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
                    new BigNumber('2'),
                    new BigNumber('3'),
                    new BigNumber('4'),
                    new BigNumber('5'),
                    new BigNumber('6'),
                    new BigNumber('6'),
                    new BigNumber('7'),
                    new BigNumber('8'),
                    new BigNumber('9'),
                    new BigNumber('10'),
                ]
            };

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                expectedWeights.addresses,
                expectedWeights.values
            );

            for (var i = 0; i < 10; i++) {
                // Incrementing source hashes to split the votes
                vote.source = '0xe03b82d609dd4c84cdf0e94796d21d65f56b197405f983e593ac4302d38a112' + i.toString(16);

                let signature = await signVote(expectedWeights.addresses[i], vote);
                let tx = await pollingPlace.vote(
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

                let events = EventsDecoder.perform(tx.receipt, originBlockStore.address, originBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the origin block store.'
                );
                events = EventsDecoder.perform(tx.receipt, auxiliaryBlockStore.address, auxiliaryBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the auxiliary block store.'
                );
            }
            for (var i = 0; i < 10; i++) {
                /*
                 * New target height as validators are not allowed to vote on
                 * the same height from the previous loop again.
                 */
                vote.targetHeight = new BigNumber('999');
                // Incrementing target hashes to split the votes
                vote.target = '0x4bd8f94ba769f24bf30c09d4a3575795a776f76ca6f772893618943ea2dab9c' + i.toString(16);

                let signature = await signVote(expectedWeights.addresses[i], vote);
                let tx = await pollingPlace.vote(
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

                let events = EventsDecoder.perform(tx.receipt, originBlockStore.address, originBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the origin block store.'
                );
                events = EventsDecoder.perform(tx.receipt, auxiliaryBlockStore.address, auxiliaryBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the auxiliary block store.'
                );
            }
        });

        it('should not have a rounding error to achive 2/3 majority', async () => {
            /*
             * There is a total weight of **61**. That means a voting weight of
             * >=41 is >=2/3 of the total weight.
             * A rounding error could lead to a requirement of
             * `61 * 2 / 3 = 40` (rounding down when dividing).
             */
            let expectedWeights = {
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
                    new BigNumber('5'),
                    new BigNumber('5'),
                    new BigNumber('5'),
                    new BigNumber('5'),
                    new BigNumber('5'),
                    new BigNumber('5'),
                    new BigNumber('5'),
                    new BigNumber('5'),
                    new BigNumber('10'),
                    new BigNumber('11'),
                ]
            };

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                expectedWeights.addresses,
                expectedWeights.values
            );

            // The first 8 validators will validate 40 of 61 weight.
            for (var i = 0; i < 8; i++) {

                let signature = await signVote(expectedWeights.addresses[i], vote);
                let tx = await pollingPlace.vote(
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

                let events = EventsDecoder.perform(tx.receipt, originBlockStore.address, originBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the origin block store.'
                );
                events = EventsDecoder.perform(tx.receipt, auxiliaryBlockStore.address, auxiliaryBlockStore.abi);
                assert.strictEqual(
                    events.Justified,
                    undefined,
                    'There should not be a Justify event emitted by the auxiliary block store.'
                );
            }
        });

        it('should not count the same validator more than once on the same target', async () => {
            let expectedWeights = {
                addresses: [
                    accounts[0],
                    accounts[1],
                ],
                values: [
                    new BigNumber('1'),
                    new BigNumber('9'),
                ]
            };

            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                expectedWeights.addresses,
                expectedWeights.values
            );

            /*
             * Letting the first validator vote multiple times on the same
             * target should lead to a revert.
             */
            vote.sourceHeight = new BigNumber('5');
            vote.targetHeight = new BigNumber('15');
            let signature = await signVote(accounts[0], vote);
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
            vote.sourceHeight = new BigNumber('8');
            signature = await signVote(accounts[0], vote);
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
                )
            );
        });

        it('should accept a vote for a target height greater than open meta-block', async () => {
            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                [accounts[0]],
                [new BigNumber('12')],
            );

            await pollingPlace.updateMetaBlockHeight(
                [],
                [],
                new BigNumber('19850912'),
                new BigNumber('19850912')
            );

            vote.targetHeight = new BigNumber('19891109');
            let signature = await signVote(accounts[0], vote);

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
            let pollingPlace = await PollingPlace.new(
                metaBlockGate,
                originCoreIdentifier,
                originBlockStore.address,
                auxiliaryCoreIdentifier,
                auxiliaryBlockStore.address,
                [accounts[0]],
                [new BigNumber('12')],
            );

            await pollingPlace.updateMetaBlockHeight(
                [],
                [],
                new BigNumber('19891109'),
                new BigNumber('19891109')
            );

            vote.targetHeight = new BigNumber('19851209');
            let signature = await signVote(accounts[0], vote);

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
                )
            );
        });

    });

    /**
     * @param {string} address The address of the account that signs the vote.
     * @param {object} vote The vote object to sign.
     * @returns {object} The signature of the vote (r, s, and v).
     */
    async function signVote(address, vote) {
        let voteDigest = Abi.soliditySHA3(
            [
                'bytes20',
                'bytes32',
                'bytes32',
                'bytes32',
                'uint256',
                'uint256',
            ],
            [
                vote.coreIdentifier,
                vote.transitionHash,
                vote.source,
                vote.target,
                vote.sourceHeight.toNumber(),
                vote.targetHeight.toNumber(),
            ],
        ).toString('hex');

        /*
         * Signature adds the prefix `\x19Ethereum Signed Message:\n32` to the
         * voteDigest.
         */
        let signature = await web3.eth.sign(
            address,
            voteDigest
        );

        // Removing the `0x` prefix.
        signature = signature.substring(2);

        let r = '0x' + signature.substring(0, 64);
        let s = '0x' + signature.substring(64, 128);
        // Adding 27 as per the web3 documentation.
        let v = Number(signature.substring(128, 130)) + 27;

        return {
            r: r,
            s: s,
            v: v,
        };
    }

});
