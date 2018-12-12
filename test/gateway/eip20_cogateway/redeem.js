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

const EIP20CoGateway = artifacts.require('EIP20CoGateway'),
    MockSafeCore = artifacts.require('MockSafeCore'),
    MessageBus = artifacts.require('MessageBus'),
    UtilityToken = artifacts.require('UtilityToken'),
    EIP20Token = artifacts.require('EIP20Token'),
    BN = require('bn.js'),
    MockToken = artifacts.require('MockToken'),
    Utils = require("../../test_lib/utils");

let eip20CoGateway,
    stateRoot = "0x70b4172eb30c495bf20b5b12224cd2380fccdd7ffa2292416b9dbdfc8511585d",
    valueToken,
    mockSafeCore,
    organization,
    gateway,
    utilityToken,
    bountyAmount,
    owner,
    redeemer,
    redeemerBalance;

async function _setup(accounts) {
    
    valueToken = accounts[0];
    mockSafeCore = await MockSafeCore.new(1, 2, stateRoot, accounts[1]);
    organization = accounts[2];
    gateway = accounts[3];
    owner = accounts[8];
    utilityToken = await MockToken.new({from: owner});
    bountyAmount = new BN(100);
    redeemer = accounts[7];
    redeemerBalance = new BN(1000);
    
    eip20CoGateway = await EIP20CoGateway.new(
        valueToken,
        utilityToken.address,
        mockSafeCore.address,
        bountyAmount,
        organization,
        gateway,
    );
    
    await utilityToken.transfer(redeemer, redeemerBalance, {from: owner});
    
    await utilityToken.approve(
        eip20CoGateway.address,
        new BN(1000),
        {from: redeemer},
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
    
    it('should fail when the bounty amount is less than expected bounty amount', async function () {
        
        let bounty = new BN(10);
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bounty},
            ),
            'Payable amount should be equal to the bounty amount.',
        );
    });
    
    it('should fail when the bounty amount is more than expected bounty amount', async function () {
        
        let bounty = new BN(10);
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bounty},
            ),
            'Payable amount should be equal to the bounty amount.',
        );
    });
    
    it('should fail when amount is zero', async function () {
        
        amount = 0;
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
            ),
            'Redeem amount must not be zero.',
        );
    });
    
    it('should fail when redeem is already initiated', async function () {
        
        await eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
            ),
            'Invalid nonce',
        );
        
    });
    
    it('should fail when previous redeem is in progress', async function () {
        
        await eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            (nonce + 1),
            hashLock,
            {from: redeemer, value: bountyAmount},
            ),
            'Invalid nonce',
        );
        
    });
    
    it('should fail when cogateway is not approved', async function () {
        
        let eip20CoGateway2 = await EIP20CoGateway.new(
            valueToken,
            utilityToken.address,
            mockSafeCore.address,
            bountyAmount,
            organization,
            gateway,
        );
        
        await Utils.expectRevert(eip20CoGateway2.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
            ),
            "Underflow when subtracting."
        );
        
    });
    
    it('should fail when the redeemer has balance less than the bounty amount', async function () {
        
        let redeemer = accounts[2],
            redeemerBalance = new BN(20);
        
        await utilityToken.transfer(redeemer, redeemerBalance, {from: owner});
        
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
            ),
            "Underflow when subtracting."
        )
    });
    
    it('should fail when the redeemer balance is less than the redeem amount', async function () {
        
        let amount = new BN(10000);
        await Utils.expectRevert(eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
            ),
            "Underflow when subtracting."
        )
    });
    
    it('should successfully redeem', async function () {
        
        let messageHash = "0x193fa194eef3c001da102ee129c23b1e13a723cb9335edefe9100e85132c77d8";
        
        let actualMessageHash = await eip20CoGateway.redeem.call(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        assert.strictEqual(
            actualMessageHash,
            messageHash,
            "Incorrect messagehash from contract",
        );
        
        let response = await eip20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        let eip20CoGatewayBaseBalance = new BN(
            await web3.eth.getBalance(eip20CoGateway.address),
        );
        
        assert.strictEqual(
            bountyAmount.eq(eip20CoGatewayBaseBalance),
            true,
            "Bounty is not transferred to CoGateway",
        );
        
        let eip20CoGatewayBalance = await utilityToken.balanceOf(eip20CoGateway.address);
        
        assert.strictEqual(
            eip20CoGatewayBalance.eq(amount),
            true,
            "EIP20CoGateway address did not receive redeemed amount",
        );
        
        let expectedBalance = new BN(redeemerBalance - amount);
        
        assert.strictEqual(
            (await utilityToken.balanceOf(redeemer)).eq(expectedBalance),
            true,
            "Redeemer EIP20 token balance should be equal to ${expectedBalance}",
        );
        
        let expectedEvent = {
            RedeemIntentDeclared: {
                _messageHash: messageHash,
                _redeemer: redeemer,
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

