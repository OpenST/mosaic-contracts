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
    describe('closing an OSTblock', async () => {
        let originCoreAccount = accounts[4];
        let ost;
        let stake;

        beforeEach(async () => {
            ost = await MockToken.new();
            stake = await Stake.new(ost.address, originCoreAccount);
        });

        it('should increase the OSTblock height by 1', async () => {
            for (let expectedHeight = 1; expectedHeight < 5; expectedHeight++) {
                await stake.closeOstBlock(
                    new BigNumber(expectedHeight - 1),
                    {from: originCoreAccount}
                );

                height = await stake.height.call();
                assert.strictEqual(
                    expectedHeight,
                    height.toNumber(),
                    "The height should increase by one when an OSTblock is closed."
                );
            }
        });

        it('should emit an event when an OSTblock is closed', async () => {
            let tx = await stake.closeOstBlock(
                new BigNumber(0),
                {from: originCoreAccount}
            );
            let events = Events.perform(tx.receipt, stake.address, stake.abi)
            assert.strictEqual(
                Number(events.HeightIncreased.newHeight),
                1,
                'The contract did not emit an event with the new height.'
            );

            tx = await stake.closeOstBlock(
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
                stake.closeOstBlock(
                    new BigNumber(3),
                    {from: originCoreAccount}
                )
            );
        });
    });

    describe('depositing new validators', async () => {
        let originCoreAccount = accounts[4];
        let ost;
        let stake;

        beforeEach(async () => {
            ost = await MockToken.new();
            stake = await Stake.new(ost.address, originCoreAccount);
        });

        it('should emit an event when depositing', async () => {
            let depositAmount = new BigNumber('250000000000000000000');
            let validatorAccount = accounts[1];

            await ost.approve(stake.address, depositAmount);
            let tx = await stake.deposit(validatorAccount, depositAmount);

            let events = Events.perform(tx.receipt, stake.address, stake.abi);
            assert.strictEqual(
                Number(events.NewDeposit.validatorId),
                0,
                'The contract did not emit an event with the given validator index.'
            );
            assert.strictEqual(
                events.NewDeposit.validatorAddress,
                validatorAccount,
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
            await deposit(accounts[0], new BigNumber('1'));
            await deposit(accounts[1], new BigNumber('2'));
            await deposit(accounts[2], new BigNumber('3'));
            
            await stake.closeOstBlock(
                new BigNumber(0),
                {from: originCoreAccount}
            );

            await deposit(accounts[3], new BigNumber('4'));

            for (let i = 0; i < 4; i++) {
                let validator = await stake.validators.call(i);
                assert.strictEqual(
                    validator[0],
                    accounts[0],
                    "Contract must store the correct depositor address."
                );
                assert.strictEqual(
                    validator[1],
                    accounts[i],
                    "Contract must store the correct validator address."
                );

                let expectedStake = i+1;
                assert.strictEqual(
                    Number(validator[2]),
                    expectedStake,
                    "Contract must store the correct stake."
                );

                assert.strictEqual(
                    validator[3],
                    false,
                    "Contract must store a validator as non-evicted."
                );
            }
        });

        async function deposit(address, deposit) {
            await ost.approve(stake.address, deposit);
            await stake.deposit(address, deposit);
        }
    });
});
