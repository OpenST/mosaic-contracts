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
// Test: progress_mint_internal.js
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
    Utils = require("../../test_lib/utils"),
    TestEIP20CoGateway = artifacts.require('TestEIP20CoGateway'),
    MockUtilityToken = artifacts.require('MockUtilityToken');

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
    stakerBalance,
    rewardAmount;

async function _setup(accounts) {
    
    valueToken = accounts[0];
    core = await Core.new(1, 2, 0, stateRoot, accounts[1]);
    organization = accounts[2];
    gateway = accounts[3];
    owner = accounts[8];
    utilityToken = await MockUtilityToken.new();
    bountyAmount = new BN(100);
    staker = accounts[7];
    stakerBalance = new BN(1000000),
    rewardAmount = new BN(100);
    
    eip20CoGateway = await EIP20CoGateway.new(
        valueToken,
        utilityToken.address,
        core.address,
        bountyAmount,
        organization,
        gateway,
    );
    
}

contract('EIP20CoGateway.progressMintInternal() ', function (accounts) {
    
    let amount,
        beneficiary = accounts[4],
        gasPrice = new BN(10),
        gasLimit = new BN(10),
        nonce = new BN(1),
        hashLockObj = Utils.generateHashLock(),
        hashLock = hashLockObj.l,
        unlockSecret = hashLockObj.s,
        facilitator = accounts[5],
        intentHash = "0x193fa194eef3c001da102ee129c23b1e13a723cb9335edefe9100e85132c77d8",
        mockEIP20CoGateway;
    
    beforeEach(async function () {
        
        await _setup(accounts);
        amount = new BN(100);
        intentHash = "0x193fa194eef3c001da102ee129c23b1e13a723cb9335edefe9100e85132c77d8";
        mockEIP20CoGateway = await TestEIP20CoGateway.new(
            valueToken,
            utilityToken.address,
            core.address,
            bountyAmount,
            organization,
            gateway,
        );
        
    });
    
    it('should pass when facilitator is rewarded', async function () {
        
        let messageHash = await mockEIP20CoGateway.setMessage.call(
            intentHash,
            nonce,
            gasPrice,
            gasLimit,
            hashLock,
            staker,
        );
        await mockEIP20CoGateway.setMessage(
            intentHash,
            nonce,
            gasPrice,
            gasLimit,
            hashLock,
            staker
        );
        await mockEIP20CoGateway.setInboxStatus(messageHash);
        await mockEIP20CoGateway.setMints(messageHash, beneficiary, amount);
        
        await mockEIP20CoGateway.progressMint(
            messageHash,
            unlockSecret,
            {from : facilitator},
        );
        
        assert.strictEqual(
            (await utilityToken.beneficiary()),
            facilitator,
            "Facilitator address is incorrect",
        );
    
        assert.strictEqual(
            (await utilityToken.amount()).eq(rewardAmount),
            true,
            "Facilitator address is incorrect",
        );
        
    });
    
    
    it('should fail when facilitator is not rewarded', async function () {
        
        gasPrice = new BN(0);
        
        let messageHash = await mockEIP20CoGateway.setMessage.call(
            intentHash,
            nonce,
            gasPrice,
            gasLimit,
            hashLock,
            staker,
        );
        
        await mockEIP20CoGateway.setMessage(intentHash,
            nonce,
            gasPrice,
            gasLimit,
            hashLock,
            staker,
        );
        await mockEIP20CoGateway.setInboxStatus(messageHash);
        await mockEIP20CoGateway.setMints(messageHash, beneficiary, amount);
        
        await mockEIP20CoGateway.progressMint(
            messageHash,
            unlockSecret,
            {from : facilitator},
        );
        
        assert.notStrictEqual(
            (await utilityToken.beneficiary()),
            facilitator,
            "Facilitator address is not correct",
        );
        
    });
    
});