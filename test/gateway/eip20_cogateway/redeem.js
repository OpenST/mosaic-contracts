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
// Test: redeem.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const EIP20CoGateway = artifacts.require('EIP20CoGateway'),
    Core = artifacts.require('MockCore'),
    MessageBus = artifacts.require('MessageBus'),
    UtilityToken = artifacts.require('UtilityToken'),
    EIP20Token = artifacts.require('EIP20Token'),
    BN = require('bn.js'),
    MockToken = artifacts.require('MockToken'),
    Utils = require("../../test_lib/utils"),
    Event = require('../../test_lib/event_decoder');

let eip20CoGateway,
    stateRoot = "0x70b4172eb30c495bf20b5b12224cd2380fccdd7ffa2292416b9dbdfc8511585d",
    valueToken,
    core,
    organization,
    gateway,
    utilityToken,
    bountyAmount,
    owner,
    staker,
    stakerBalance;

async function _setup(accounts) {
    
    valueToken = accounts[0];
    core = await Core.new(1, 2, 0, stateRoot, accounts[1]);
    organization = accounts[2];
    gateway = accounts[3];
    owner = accounts[8];
    utilityToken = await MockToken.new({from: owner});
    bountyAmount = new BN(100);
    staker = accounts[7];
    stakerBalance = new BN(1000000);

    eip20CoGateway = await EIP20CoGateway.new(
        valueToken,
        utilityToken.address,
        core.address,
        bountyAmount,
        organization,
        gateway,
    );
    
    await utilityToken.transfer(staker, stakerBalance,{from: owner});
    
    await utilityToken.approve(
        eip20CoGateway.address,
        new BN(1000),
        {from: staker},
    );
    
}

contract('EIP20CoGateway.redeem() ', function (accounts) {
    
    let amount,
        beneficiary = accounts[4],
        gasPrice = new BN(10),
        gasLimit = new BN(10),
        nonce = new BN(1),
        hashLockObj = Utils.generateHashLock(),
        hashLock = hashLockObj.l;
    
    beforeEach(async function () {
        
        await _setup(accounts);
        amount = new BN(100);
        
    });
    
    it('should fail when the sent payable amount is not equal as contact\'s bounty amount', async function () {

        let bounty = new BN(10);
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            { from: staker, value: bounty },
            ),
            'msg.value must match the bounty amount',
        );
    });
    
    it('should fail when amount is 0', async function () {

        amount = 0;
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            { from: staker, value: bountyAmount },
            ),
            'Redeem amount must not be zero',
        );
    });
    
    it('should fail when replay attack is performed', async function () {
        
        await eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            { from: staker, value: bountyAmount },
        );
        
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            { from: staker, value: bountyAmount },
            ),
            'Invalid nonce',
        );
        
    });
    
    it('should successfully redeem', async function () {
    
        let messageHash = "0x193fa194eef3c001da102ee129c23b1e13a723cb9335edefe9100e85132c77d8";
        
        let response = await eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            { from: staker, value: bountyAmount },
        );

        let eip20CoGatewayBalance = await utilityToken.balanceOf(eip20CoGateway.address);
        
        assert.strictEqual(eip20CoGatewayBalance.eq(amount),
            true,
            "EIP20CoGateway was not redeemed",
        );
        
        assert.strictEqual(
            (await utilityToken.balanceOf(staker)).eq(new BN(stakerBalance - amount)),
            true,
            "Staker balance is incorrect",
        );
        
        let events = Event.getEvents(response, eip20CoGateway);
        
        let expectedEvent = {
            RedeemIntentDeclared: {
                _messageHash: messageHash,
                _redeemer: staker,
                _redeemerNonce: nonce,
                _beneficiary: beneficiary,
                _amount: amount
            }
        };
    
        assert.equal(
            response.receipt.status,
            1,
            "Receipt status is unsuccessful"
        );
    
        let eventData = response.logs;
        await Utils.validateEvents(eventData, expectedEvent);

    });
    
});
