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

const BN = require('bn.js');
const Events = require('../../test_lib/event_decoder.js');
const StakeUtils = require('./helpers/stake_utils.js');
const Utils = require('../../test_lib/utils.js');

const MockToken = artifacts.require('MockToken');
const Stake = artifacts.require('Stake');

contract('Stake.deposit()', async (accounts) => {

    let mosaicCoreAccount = accounts[4];
    let minimumWeight = new BN('1');
    let token;
    let stake;

    beforeEach(async () => {
        token = await MockToken.new();
        stake = await Stake.new(
            token.address,
            mosaicCoreAccount,
            minimumWeight,
        );
        await StakeUtils.initializeStake(
            stake,
            token,
            accounts[0],
            [accounts[8]],
            [new BN('2')],
        );
    });

    it('should emit an event when depositing', async () => {
        let depositAmount = new BN('250000000000000000000');
        let validatorAccount = accounts[1];

        let tx = await StakeUtils.deposit(
            token,
            stake,
            validatorAccount,
            depositAmount,
        );

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

        let firstDepositAmount = new BN('10');
        let secondDepositAmount = new BN('5');

        // Transferring to the second account so it can deposit
        await token.transfer(secondDepositAccount, secondDepositAmount);

        await StakeUtils.deposit(
            token,
            stake,
            firstValidatorAccount,
            firstDepositAmount,
        );

        await token.approve(
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

        let firstDepositAmount = new BN('10');
        let secondDepositAmount = new BN('5');

        // Transferring to the second account so it can deposit
        await token.transfer(secondDepositAccount, secondDepositAmount);

        await StakeUtils.deposit(
            token,
            stake,
            validatorAccount,
            firstDepositAmount,
        );

        await token.approve(
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
            StakeUtils.deposit(
                token,
                stake,
                '0x0000000000000000000000000000000000000000',
                new BN('15'),
            )
        );
    });

    it('should not accept a zero deposit', async () => {
        await Utils.expectRevert(
            StakeUtils.deposit(
                token,
                stake,
                accounts[4],
                new BN('0'),
            ),
        );
    });

    it('should store deposited validators', async () => {
        let expectedDeposits = [
            {
                address: accounts[1],
                deposit: new BN('1'),
                startingHeight: 3
            }, {
                address: accounts[2],
                deposit: new BN('20'),
                startingHeight: 3
            }, {
                address: accounts[3],
                deposit: new BN('300'),
                startingHeight: 3
            }, {
                address: accounts[4],
                deposit: new BN('4000'),
                startingHeight: 4
            },
        ];

        await StakeUtils.deposit(
            token,
            stake,
            expectedDeposits[0].address,
            expectedDeposits[0].deposit,
        );
        await StakeUtils.deposit(
            token,
            stake,
            expectedDeposits[1].address,
            expectedDeposits[1].deposit,
        );
        await StakeUtils.deposit(
            token,
            stake,
            expectedDeposits[2].address,
            expectedDeposits[2].deposit,
        );

        await stake.closeMetaBlock(
            new BN(1),
            {from: mosaicCoreAccount},
        );

        await StakeUtils.deposit(
            token,
            stake,
            expectedDeposits[3].address,
            expectedDeposits[3].deposit,
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
