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
// Test: Stake.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const BigNumber = require('bignumber.js');
const Utils = require('../test_lib/utils.js');
const Events = require('../test_lib/event_decoder.js');

const MockToken = artifacts.require('MockToken');

const Stake = artifacts.require('Stake');

contract('Stake', async (accounts) => {

    let originCoreAccount = accounts[4];
    let ost;
    let stake;

    beforeEach(async () => {
        ost = await MockToken.new();
        stake = await Stake.new(ost.address, originCoreAccount);
    });

    describe('closing an meta-block', async () => {

        it('should increase the meta-block height by 1', async () => {
            for (let expectedHeight = 1; expectedHeight < 5; expectedHeight++) {
                await stake.closeMetaBlock(
                    new BigNumber(expectedHeight - 1),
                    {from: originCoreAccount}
                );

                height = await stake.height.call();
                assert.strictEqual(
                    expectedHeight,
                    height.toNumber(),
                    "The height should increase by one when an meta-block is closed."
                );
            }
        });

        it('should emit an event when an meta-block is closed', async () => {
            let tx = await stake.closeMetaBlock(
                new BigNumber(0),
                {from: originCoreAccount}
            );
            let events = Events.perform(tx.receipt, stake.address, stake.abi)
            assert.strictEqual(
                Number(events.HeightIncreased.newHeight),
                1,
                'The contract did not emit an event with the new height.'
            );

            tx = await stake.closeMetaBlock(
                new BigNumber(1),
                {from: originCoreAccount}
            );
            events = Events.perform(tx.receipt, stake.address, stake.abi)
            assert.strictEqual(
                Number(events.HeightIncreased.newHeight),
                2,
                'The contract did not emit an event with the new height.'
            );
        });

        it('should fail when a wrong height is given', async () => {
            await Utils.expectFailedAssert(
                stake.closeMetaBlock(
                    new BigNumber(3),
                    {from: originCoreAccount}
                )
            );
        });
    });

    describe('depositing new validators', async () => {

        it('should emit an event when depositing', async () => {
            let depositAmount = new BigNumber('250000000000000000000');
            let validatorAccount = accounts[1];

            let tx = await deposit(validatorAccount, depositAmount);

            let events = Events.perform(tx.receipt, stake.address, stake.abi);
            assert.strictEqual(
                web3.utils.toChecksumAddress(events.NewDeposit.validatorAddress),
                web3.utils.toChecksumAddress(validatorAccount),
                'The contract did not emit an event with the given validator address.'
            );
            assert.strictEqual(
                Number(events.NewDeposit.stake),
                Number(depositAmount),
                'The contract did not emit an event with the given stake.'
            );
        });

        it('should register different validators', async () => {
            let secondDepositAccount = accounts[5];
            let firstValidatorAccount = accounts[2];
            let secondValidatorAccount = accounts[7];

            let firstDepositAmount = new BigNumber('10');
            let secondDepositAmount = new BigNumber('5');

            // Transferring to the second account so it can deposit
            await ost.transfer(secondDepositAccount, secondDepositAmount);

            await deposit(firstValidatorAccount, firstDepositAmount);

            await ost.approve(
                stake.address,
                secondDepositAmount,
                {from: secondDepositAccount}
            );
            await stake.deposit(
                secondValidatorAccount,
                secondDepositAmount,
                {from: secondDepositAccount}
            );
        });

        it('should not register an existing validator', async () => {
            let secondDepositAccount = accounts[5];
            let validatorAccount = accounts[2];

            let firstDepositAmount = new BigNumber('10');
            let secondDepositAmount = new BigNumber('5');

            // Transferring to the second account so it can deposit
            await ost.transfer(secondDepositAccount, secondDepositAmount);

            await deposit(validatorAccount, firstDepositAmount);

            await ost.approve(
                stake.address,
                secondDepositAmount,
                {from: secondDepositAccount}
            );
            await Utils.expectRevert(
                stake.deposit(
                    validatorAccount,
                    secondDepositAmount,
                    {from: secondDepositAccount}
                )
            );
        });

        it('should not accept a zero validator address', async () => {
            await Utils.expectRevert(
                deposit(
                    '0x0000000000000000000000000000000000000000',
                    new BigNumber('15')
                )
            );
        });

        it('should not accept a zero deposit', async () => {
            await Utils.expectRevert(
                deposit(accounts[4], new BigNumber('0'))
            );
        });

        it('should store deposited validators', async () => {
            let expectedDeposits = [
                {
                    address: accounts[1],
                    deposit: new BigNumber('1'),
                    startingHeight: 2
                }, {
                    address: accounts[2],
                    deposit: new BigNumber('20'),
                    startingHeight: 2
                }, {
                    address: accounts[3],
                    deposit: new BigNumber('300'),
                    startingHeight: 2
                }, {
                    address: accounts[4],
                    deposit: new BigNumber('4000'),
                    startingHeight: 3
                },
            ];

            await deposit(
                expectedDeposits[0].address,
                expectedDeposits[0].deposit
            );
            await deposit(
                expectedDeposits[1].address,
                expectedDeposits[1].deposit
            );
            await deposit(
                expectedDeposits[2].address,
                expectedDeposits[2].deposit
            );

            await stake.closeMetaBlock(
                new BigNumber(0),
                {from: originCoreAccount}
            );

            await deposit(
                expectedDeposits[3].address,
                expectedDeposits[3].deposit
            );

            let expectationCount = expectedDeposits.length;
            for (let i = 0; i < expectationCount; i++) {
                let expectedDeposit = expectedDeposits[i];
                let validator = await stake.validators.call(
                    expectedDeposit.address
                );

                assert.strictEqual(
                    validator[0],
                    accounts[0],
                    "Contract must store the correct depositor address."
                );
                assert.strictEqual(
                    validator[1],
                    expectedDeposit.address,
                    "Contract must store the correct validator address."
                );

                assert.strictEqual(
                    Number(validator[2]),
                    Number(expectedDeposit.deposit),
                    "Contract must store the correct stake."
                );

                assert.strictEqual(
                    Number(validator[3]),
                    Number(expectedDeposit.startingHeight),
                    "Contract must store the correct starting height."
                );

                assert.strictEqual(
                    validator[4],
                    false,
                    "Contract must store a validator as non-evicted."
                );
            }
        });
    });

    describe('getting weight for validators', async () => {

        it('returns the weight of registered validators', async () => {
            await deposit(accounts[4], new BigNumber('12091985'));
            await deposit(accounts[2], new BigNumber('1337'));
            
            let weight = await stake.weight(2, accounts[4]);
            assert.strictEqual(
                Number(weight),
                12091985,
                "The weight should equal the deposit."
            );

            weight = await stake.weight(5, accounts[2]);
            assert.strictEqual(
                Number(weight),
                1337,
                "The weight should equal the deposit."
            );
        });

        it('returns a zero weight for unknown validators', async () => {
            await deposit(accounts[4], new BigNumber('12091985'));
            await deposit(accounts[2], new BigNumber('1337'));
            
            let weight = await stake.weight(2, accounts[0]);
            assert.strictEqual(
                Number(weight),
                0,
                "The weight should equal the deposit."
            );

            weight = await stake.weight(5, accounts[1]);
            assert.strictEqual(
                Number(weight),
                0,
                "The weight should equal the deposit."
            );
        });

        it('returns a zero weight for future validators', async () => {
            await deposit(accounts[4], new BigNumber('12091985'));
            await deposit(accounts[2], new BigNumber('1337'));
            
            let weight = await stake.weight(1, accounts[4]);
            assert.strictEqual(
                Number(weight),
                0,
                "The weight should equal the deposit."
            );

            weight = await stake.weight(0, accounts[2]);
            assert.strictEqual(
                Number(weight),
                0,
                "The weight should equal the deposit."
            );
        });
    });

    describe('getting the total weight', async () => {
        it('should store the correct accumulative weight', async () => {
            await deposit(accounts[1], new BigNumber('1'));
            await deposit(accounts[2], new BigNumber('2'));
            stake.closeMetaBlock(
                new BigNumber(0),
                {from: originCoreAccount}
            )
            await deposit(accounts[3], new BigNumber('4'));
            stake.closeMetaBlock(
                new BigNumber(1),
                {from: originCoreAccount}
            )
            await deposit(accounts[4], new BigNumber('8'));
            await deposit(accounts[5], new BigNumber('16'));

            let expecteds = [
                {height: 0, totalWeight: 0},
                {height: 1, totalWeight: 0},
                {height: 2, totalWeight: 3},
                {height: 3, totalWeight: 7},
                {height: 4, totalWeight: 31},
                {height: 10, totalWeight: 31},
                {height: 1000, totalWeight: 31},
            ];

            for (let i = 0; i < expecteds.length; i++) {
                let expected = expecteds[i];
                let totalWeight = await stake.totalWeightAtHeight(expected.height);

                assert.strictEqual(
                    totalWeight.toNumber(),
                    expected.totalWeight,
                    "The total weight at this height should be different."
                );
            }
        });
    });

    async function deposit(address, deposit) {
        await ost.approve(stake.address, deposit);
        let tx = await stake.deposit(address, deposit);

        return tx;
    }
});
