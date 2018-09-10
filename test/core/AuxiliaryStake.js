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
// Test: AuxiliaryCore.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');
const utils = require('../lib/utils.js');

const AuxiliaryStake = artifacts.require('AuxiliaryStake');

const ValidatorIndexAuxiliaryAddress = 0;
const ValidatorIndexStake = 1;
const ValidatorIndexEnded = 2;
const ValidatorIndexStartHeight = 3;
const ValidatorIndexEndHeight = 4;

contract('AuxiliaryStake', async (accounts) => {
    describe('deploying an auxiliary stake contract', async () => {
        /*
         * Make the first address the default OSTblock gate to be able to
         * call methods that change the set of validators from the default
         * message caller address.
         */
        let defaultOstBlockGate = accounts[0];

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
                    '0x000000000000000000000000000000000000000a',
                    '0x000000000000000000000000000000000000000b',
                    '0x000000000000000000000000000000000000000c',
                    '0x000000000000000000000000000000000000000d',
                    '0x000000000000000000000000000000000000000e',
                    '0x000000000000000000000000000000000000000f',
                    '0x0000000000000000000000000000000000000010',
                    '0x0000000000000000000000000000000000000011',
                    '0x0000000000000000000000000000000000000012',
                    '0x0000000000000000000000000000000000000013',
                ],
                values: [
                    new BigNumber('1'),
                    new BigNumber('2'),
                    new BigNumber('3'),
                    new BigNumber('4'),
                    new BigNumber('5'),
                    new BigNumber('6'),
                    new BigNumber('7'),
                    new BigNumber('8'),
                    new BigNumber('9'),
                    new BigNumber('10'),
                    new BigNumber('11'),
                    new BigNumber('12'),
                    new BigNumber('13'),
                    new BigNumber('14'),
                    new BigNumber('15'),
                    new BigNumber('16'),
                    new BigNumber('17'),
                    new BigNumber('18'),
                    new BigNumber('19'),
                ]
            };

            let auxiliaryStake = await AuxiliaryStake.new(
                defaultOstBlockGate,
                expectedStakes.addresses,
                expectedStakes.values
            );

            let ostBlockGate = await auxiliaryStake.ostBlockGate.call();
            assert.strictEqual(
                ostBlockGate,
                defaultOstBlockGate,
                'The contract must store the correct OSTblock gate.'
            );

            // Check for all individual stakes to be recorded
            for (var i = 0; i < 19; i++) {
                let validator = await auxiliaryStake.validators.call(expectedStakes.addresses[i]);

                assert.strictEqual(
                    validator[ValidatorIndexAuxiliaryAddress],
                    expectedStakes.addresses[i],
                    'The contract must record the correct auxilary address of a validator.'
                );
                assert(
                    validator[ValidatorIndexStake].equals(expectedStakes.values[i]),
                    'The contract must record the correct staking value address of a validator.'
                );
                assert.strictEqual(
                    validator[ValidatorIndexEnded],
                    false,
                    'The contract must record that a validator hasn\'t ended on construction.'
                );
                assert(
                    validator[ValidatorIndexStartHeight].equals(new BigNumber('0')),
                    'The contract must record a zero starting height at construction.'
                );
                assert(
                    validator[ValidatorIndexEndHeight].equals(new BigNumber('0')),
                    'The contract must record a zero ending height at construction.'
                );
            }

            let totalStakeAtZero = await auxiliaryStake.totalStakes.call(0);
            assert(
                totalStakeAtZero.equals(new BigNumber('190')),
                'The contract must track the sum of all stakes as total stakes.'
            );
        });

        it('should not accept a zero OSTblock gate', async () => {
            await utils.expectRevert(
                AuxiliaryStake.new(
                    '0x0000000000000000000000000000000000000000',
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

        it('should not accept an empty validator set', async () => {
            await utils.expectRevert(
                AuxiliaryStake.new(
                    defaultOstBlockGate,
                    [],
                    []
                )
            );
        });

        it('should not accept two arrays of different length', async () => {
            await utils.expectRevert(
                AuxiliaryStake.new(
                    defaultOstBlockGate,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BigNumber('1'),
                    ]
                )
            );
        });

        it('should not accept a zero stake', async () => {
            await utils.expectRevert(
                AuxiliaryStake.new(
                    defaultOstBlockGate,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('0'),
                    ]
                )
            );
        });

        it('should not accept a zero address', async () => {
            await utils.expectRevert(
                AuxiliaryStake.new(
                    defaultOstBlockGate,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000000',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('2'),
                    ]
                )
            );
        });

        it('should not accept the same address more than once', async () => {
            await utils.expectRevert(
                AuxiliaryStake.new(
                    defaultOstBlockGate,
                    [
                        '0x0000000000000000000000000000000000000001',
                        '0x0000000000000000000000000000000000000002',
                        '0x0000000000000000000000000000000000000001',
                    ],
                    [
                        new BigNumber('1'),
                        new BigNumber('2'),
                        new BigNumber('3'),
                    ]
                )
            );
        })
    });
});
