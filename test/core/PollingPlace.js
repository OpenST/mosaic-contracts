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
const utils = require('../test_lib/utils.js');

const PollingPlace = artifacts.require('PollingPlace');

const ValidatorIndexAuxiliaryAddress = 0;
const ValidatorIndexStake = 1;
const ValidatorIndexEnded = 2;
const ValidatorIndexStartHeight = 3;
const ValidatorIndexEndHeight = 4;

contract('PollingPlace', async (accounts) => {
    describe('deploying a polling place contract', async () => {
        /*
         * Make the first address the default meta-block gate to be able to
         * call methods that change the set of validators from the default
         * message caller address.
         */
        let defaultMetaBlockGate = accounts[0];

        it('should store a correct list of initial validators', async () => {
            let expectedStakes = {
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
                defaultMetaBlockGate,
                expectedStakes.addresses,
                expectedStakes.values
            );

            let metaBlockGate = await pollingPlace.metaBlockGate.call();
            assert.strictEqual(
                metaBlockGate,
                defaultMetaBlockGate,
                'The contract must store the correct meta-block gate.'
            );

            // Check for all individual stakes to be recorded
            for (var i = 0; i < 19; i++) {
                let validator = await pollingPlace.validators.call(expectedStakes.addresses[i]);

                assert.strictEqual(
                    validator[ValidatorIndexAuxiliaryAddress],
                    expectedStakes.addresses[i],
                    'The contract must record the correct auxilary address of a validator.'
                );
                assert(
                    validator[ValidatorIndexStake].eq(expectedStakes.values[i]),
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

            let totalStakeAtZero = await pollingPlace.totalStakes.call(0);
            assert(
                totalStakeAtZero.eq(new BN('190')),
                'The contract must track the sum of all stakes as total stakes.'
            );
        });

        it('should not accept a zero meta-block gate', async () => {
            await utils.expectRevert(
                PollingPlace.new(
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
            await utils.expectRevert(
                PollingPlace.new(
                    defaultMetaBlockGate,
                    [],
                    []
                )
            );
        });

        it('should not accept two arrays of different length', async () => {
            await utils.expectRevert(
                PollingPlace.new(
                    defaultMetaBlockGate,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BN('1'),
                    ]
                )
            );
        });

        it('should not accept a zero stake', async () => {
            await utils.expectRevert(
                PollingPlace.new(
                    defaultMetaBlockGate,
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
            await utils.expectRevert(
                PollingPlace.new(
                    defaultMetaBlockGate,
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
            await utils.expectRevert(
                PollingPlace.new(
                    defaultMetaBlockGate,
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
});
