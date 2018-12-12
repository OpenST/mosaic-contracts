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

const SimpleStake = artifacts.require("./SimpleStake.sol");
const MockToken = artifacts.require("./MockToken.sol");
const BN = require('bn.js');

const Utils = require('../../../test/test_lib/utils.js');
const Events = require('../../test_lib/event_decoder.js');

contract('SimpleStake.releaseTo()', function (accounts) {

    const gateway = accounts[4];
    let token, simpleStake;
    beforeEach(async function () {
        token = await MockToken.new({from: accounts[0]});
        let amount = new BN(100);

        simpleStake = await SimpleStake.new(
            token.address,
            gateway,
            {from: accounts[0]},
        );

        await token.transfer(simpleStake.address, amount, {from: accounts[0]});
    });

    it('should pass with correct parameters', async function () {

        let beneficiary = accounts[5];
        let releasedAmount = new BN(50);

        let previousBeneficiaryBalance = await token.balanceOf.call(beneficiary);
        let previousSimpleStakeBalance = await token.balanceOf.call(simpleStake.address);

        let success = await simpleStake.releaseTo.call(
            beneficiary,
            releasedAmount,
            {from: gateway},
        );

        assert.strictEqual(
            success,
            true,
            'Expected success status.',
        );

        let tx = await simpleStake.releaseTo(
            beneficiary,
            releasedAmount,
            {from: gateway},
        );

        let events = Events.perform(
            tx.receipt,
            simpleStake.address,
            simpleStake.abi,
        );

        assert.isDefined(
            events.ReleasedStake,
            'Release stake event not emitted.',
        );
        assert.strictEqual(
            events.ReleasedStake._gateway,
            gateway,
            'Expected gateway address is different from actual address.',
        );
        assert.strictEqual(
            events.ReleasedStake._to,
            beneficiary,
            'Expected beneficiary address is different from actual address.',
        );
        assert.strictEqual(
            events.ReleasedStake._amount.eq(releasedAmount),
            true,
            'Released stake amount is different from expected amount.',
        );

        let expectedBeneficiaryBalance = previousBeneficiaryBalance.add(releasedAmount);
        let expectedSimpleStakeBalance = previousSimpleStakeBalance.sub(releasedAmount);

        let latestBeneficiaryBalance = await token.balanceOf.call(beneficiary);
        let latestSimpleStakeBalance = await token.balanceOf.call(simpleStake.address);
        assert.strictEqual(
            latestBeneficiaryBalance.eq(expectedBeneficiaryBalance),
            true,
            'Expected balance of beneficiary after release is not equal to' +
            ' actual balance',
        );

        assert.strictEqual(
            latestSimpleStakeBalance.eq(expectedSimpleStakeBalance),
            true,
            'Expected balance of simple stake after release is not equal to' +
            ' actual balance',
        );

    });

    it('should fail if amount is zero', async function () {

        let beneficiary = accounts[5];
        let releasedAmount = new BN(0);

        await Utils.expectRevert(
            simpleStake.releaseTo(beneficiary, releasedAmount, {from: gateway}),
            'Amount must not be zero.'
        );
    });

    it('should fail if simple stake has insufficient EIP20 fund', async function () {

        let beneficiary = accounts[5];
        let releasedAmount = new BN(200);

        await Utils.expectRevert(
            simpleStake.releaseTo(beneficiary, releasedAmount, {from: gateway}),
            'Underflow when subtracting.',
        );
    });

    it('should fail if not called by gateway', async function () {

        let beneficiary = accounts[5];
        let releasedAmount = new BN(10);

        await Utils.expectRevert(
            simpleStake.releaseTo(beneficiary, releasedAmount, {from: accounts[3]}),
            'Only gateway can call the function.',
        );
    });

});
