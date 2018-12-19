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

const TestEIP20CoGateway = artifacts.require('TestEIP20CoGateway'),
    MockAnchor = artifacts.require('MockAnchor'),
    MessageBus = artifacts.require('MessageBus'),
    UtilityToken = artifacts.require('UtilityToken'),
    EIP20Token = artifacts.require('EIP20Token'),
    BN = require('bn.js'),
    MockToken = artifacts.require('MockToken'),
    Utils = require("../../test_lib/utils");

let testEIP20CoGateway,
    burner,
    valueToken,
    dummyStateRootProvider,
    membersManager,
    gateway,
    utilityToken,
    bountyAmount,
    owner,
    redeemer,
    redeemerBalance;

let MessageStatusEnum = {
    Undeclared: 0,
    Declared: 1,
    Progressed: 2,
    DeclaredRevocation: 3,
    Revoked: 4
};

async function _setup(accounts) {
    
    valueToken = accounts[0];
    dummyStateRootProvider = accounts[1];
    membersManager = accounts[2];
    gateway = accounts[3];
    owner = accounts[8];
    utilityToken = await MockToken.new({from: owner});
    bountyAmount = new BN(100);
    redeemer = accounts[7];
    redeemerBalance = new BN(1000);
    burner = accounts[10];
    
    testEIP20CoGateway = await TestEIP20CoGateway.new(
        valueToken,
        utilityToken.address,
        dummyStateRootProvider,
        bountyAmount,
        membersManager,
        gateway,
        burner
    );
    
    await utilityToken.transfer(redeemer, redeemerBalance, {from: owner});
    
    await utilityToken.approve(
        testEIP20CoGateway.address,
        redeemerBalance,
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
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
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
        
        let bounty = new BN(110);
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
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
    
    it('should fail when redeem amount is zero', async function () {
        
        amount = 0;
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
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
    
    it('should fail when redeem with same nonce is already initiated', async function () {
        
        await testEIP20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        amount = new BN(200);
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount},
            ),
            'Invalid nonce.',
        );
        
    });
    
    it('should fail when previous redeem is in progress', async function () {
        
        await testEIP20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce.addn(1),
                hashLock,
                {from: redeemer, value: bountyAmount},
            ),
            'Previous process is not completed.',
        );
        
    });
    
    it('should fail when cogateway is not approved with redeem amount', async function () {
        
        amount = new BN(100000);
        
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount},
            ),
            "Underflow when subtracting.",
        );
        
    });
    
    it('should fail when the redeemer \'s base token balance is less than the bounty amount', async function () {
        
        bountyAmount = new BN(10);
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount},
            ),
            "Payable amount should be equal to the bounty amount.",
        )
    });
    
    it('should fail when the redeemer\'s BT balance is less than the redeem amount', async function () {
        
        let amount = new BN(10000);
        
        await utilityToken.approve(
            testEIP20CoGateway.address,
            amount,
            {from: redeemer},
        );
        
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount},
            ),
            "Underflow when subtracting.",
        )
    });
    
    it('should fail when the message status is progressed', async function () {
        
        let messageHash = await testEIP20CoGateway.redeem.call(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await testEIP20CoGateway.setOutboxStatus(
            messageHash,
            MessageStatusEnum.Progressed,
        );
        
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount}
            ),
            "Message on source must be Undeclared."
        );
        
    });
    
    it('should fail when the message status is declared revocation', async function () {
        
        let messageHash = await testEIP20CoGateway.redeem.call(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await testEIP20CoGateway.setOutboxStatus(
            messageHash,
            MessageStatusEnum.DeclaredRevocation,
        );
        
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount}
            ),
            "Message on source must be Undeclared."
        );
        
    });
    
    it('should fail when the message status is declared', async function () {
        
        let messageHash = await testEIP20CoGateway.redeem.call(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await testEIP20CoGateway.setOutboxStatus(
            messageHash,
            MessageStatusEnum.Declared,
        );
        
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount}
            ),
            "Message on source must be Undeclared."
        );
        
    });
    
    it('should fail when the message status is revoked', async function () {
        
        let messageHash = await testEIP20CoGateway.redeem.call(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await testEIP20CoGateway.setOutboxStatus(
            messageHash,
            MessageStatusEnum.Revoked,
        );
        
        await Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                {from: redeemer, value: bountyAmount}
            ),
            "Message on source must be Undeclared."
        );
        
    });
    
    it('should fail if the previous process is in revocation declared state', async function () {
        
        let messageHash = await testEIP20CoGateway.redeem.call(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await testEIP20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        await testEIP20CoGateway.setOutboxStatus(
            messageHash,
            MessageStatusEnum.DeclaredRevocation,
        );
        
        Utils.expectRevert(
            testEIP20CoGateway.redeem(
                amount,
                beneficiary,
                gasPrice,
                gasLimit,
                nonce.addn(1),
                hashLock,
                {from: redeemer, value: bountyAmount},
            ),
            'Previous process is not completed.'
        );
        
    });
    
    
    it('should successfully redeem', async function () {
        
        let messageHash = "0x193fa194eef3c001da102ee129c23b1e13a723cb9335edefe9100e85132c77d8";
        
        let actualMessageHash = await testEIP20CoGateway.redeem.call(
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
            "Incorrect messageHash from contract",
        );
        
        let response = await testEIP20CoGateway.redeem(
            amount,
            beneficiary,
            gasPrice,
            gasLimit,
            nonce,
            hashLock,
            {from: redeemer, value: bountyAmount},
        );
        
        let eip20CoGatewayBaseBalance = new BN(
            await web3.eth.getBalance(testEIP20CoGateway.address),
        );
        
        assert.strictEqual(
            bountyAmount.eq(eip20CoGatewayBaseBalance),
            true,
            "Bounty is not transferred to CoGateway",
        );
        
        let eip20CoGatewayBalance = await utilityToken.balanceOf(testEIP20CoGateway.address);
        
        assert.strictEqual(
            eip20CoGatewayBalance.eq(amount),
            true,
            "EIP20CoGateway address did not receive redeemed amount",
        );
        
        let expectedBalance = redeemerBalance.sub(amount);
        
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

