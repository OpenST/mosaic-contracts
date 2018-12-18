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

const BN = require('bn.js'),
  Utils = require('../../test_lib/utils'),
  EIP20CoGatewayHelper = require('./helpers/helper'),
  MessageBus = artifacts.require('MessageBus'),
  EIP20Token = artifacts.require('EIP20Token'),
  TestEIP20CoGateway = artifacts.require('TestEIP20CoGateway'),
  TestUtilityToken = artifacts.require('TestUtilityToken');

let valueToken,
  burner,
  mockSafeCore,
  membersManager,
  coGateway,
  testUtilityToken,
  bountyAmount,
  owner,
  staker,
  stakerBalance,
  rewardAmount,
  symbol = 'OST',
  name = 'Simple Token',
  decimals = 18,
  helper;

const zeroBytes =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

let MessageStatusEnum = {
  Undeclared: 0,
  Declared: 1,
  Progressed: 2,
  DeclaredRevocation: 3,
  Revoked: 4
};

async function _setup(accounts) {
  
  valueToken = accounts[0];
  burner = accounts[10];
  mockSafeCore = accounts[11];
  membersManager = accounts[2];
  coGateway = accounts[3];
  owner = accounts[8];
  testUtilityToken = await TestUtilityToken.new(
    valueToken,
    symbol,
    name,
    decimals,
    membersManager
  );
  bountyAmount = new BN(100);
  staker = accounts[7];
  stakerBalance = new BN(1000000);
  rewardAmount = new BN(100);
  
}

contract('EIP20CoGateway.progressMint() ', function (accounts) {
  
  let amount = new BN(200),
    beneficiary = accounts[4],
    gasPrice,
    gasLimit,
    nonce = new BN(1),
    hashLockObj = Utils.generateHashLock(),
    facilitator = accounts[5],
    intentHash,
    hashLock,
    unlockSecret,
    testEIP20CoGateway,
    messageHash;
  helper = new EIP20CoGatewayHelper();
  
  beforeEach(async function () {
    
    await _setup(accounts);
    amount = new BN(200);
    hashLock = hashLockObj.l;
    unlockSecret = hashLockObj.s;
    gasPrice = new BN(10);
    gasLimit = new BN(10);
    
    intentHash = await helper.hashRedeemIntent(
      amount,
      beneficiary,
      facilitator,
      nonce,
      gasPrice,
      gasLimit,
      valueToken,
    );
    testEIP20CoGateway = await TestEIP20CoGateway.new(
      valueToken,
      testUtilityToken.address,
      mockSafeCore,
      bountyAmount,
      membersManager,
      coGateway,
      burner,
    );
    
    await testUtilityToken.setCoGatewayAddress(testEIP20CoGateway.address);
    
    await helper.setCoGateway(testEIP20CoGateway.address);
    
    messageHash = await testEIP20CoGateway.setStakeMessage.call(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      hashLock,
      staker,
    );
    await testEIP20CoGateway.setStakeMessage(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      hashLock,
      staker,
    );
    
    await testEIP20CoGateway.setMints(messageHash, beneficiary, amount);
    
  });
  
  it('should progress mint for non-zero facilitator reward', async function () {
    
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    
    let progressMintValues = await testEIP20CoGateway.progressMint.call(
      messageHash,
      unlockSecret,
      {from: facilitator},
    );
    
    let expectedMintedToken = new BN(100),
      expectedReward = new BN(100);
    
    assert.strictEqual(
      progressMintValues.beneficiary_,
      beneficiary,
      `Beneficiary address should be ${beneficiary}`,
    );
    
    assert.strictEqual(
      amount.eq(progressMintValues.stakeAmount_),
      true,
      `Staked amount should be ${amount}.`,
    );
    
    assert.strictEqual(
      expectedMintedToken.eq(progressMintValues.mintedAmount_),
      true,
      `Minted amount should be ${expectedMintedToken}.`,
    );
    
    assert.strictEqual(
      expectedReward.eq(progressMintValues.rewardAmount_),
      true,
      `Reward to facilitator should be ${expectedReward}.`,
    );
    
    let response = await testEIP20CoGateway.progressMint(
      messageHash,
      unlockSecret,
      {from: facilitator},
    );
    
    let facilitatorBalance = await testUtilityToken.balanceOf(facilitator);
    let beneficiaryBalance = await testUtilityToken.balanceOf(beneficiary);
    
    assert.strictEqual(
      facilitatorBalance.eq(expectedReward),
      true,
      `Facilitator reward should be ${expectedReward}.`,
    );
    
    assert.strictEqual(
      beneficiaryBalance.eq(amount.sub(expectedReward)),
      true,
      `Beneficiary balance should be ${amount.sub(expectedReward)}.`
    );
    
    let expectedEvent = {
      MintProgressed: {
        _messageHash: messageHash,
        _staker: staker,
        _stakeAmount: amount,
        _mintedAmount: expectedMintedToken,
        _rewardAmount: expectedReward,
        _proofProgress: false,
        _unlockSecret: unlockSecret
      }
    };
    
    assert.equal(
      response.receipt.status,
      1,
      'Receipt status is unsuccessful.',
    );
    
    let eventData = response.logs;
    Utils.validateEvents(eventData, expectedEvent);
    
  });
  
  it('should progress mint for zero facilitator reward', async function () {
    
    gasPrice = new BN(0);
    
    let messageHash = await testEIP20CoGateway.setStakeMessage.call(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      hashLock,
      staker,
    );
    
    await testEIP20CoGateway.setStakeMessage(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      hashLock,
      staker,
    );
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    await testEIP20CoGateway.setMints(messageHash, beneficiary, amount);
    
    let response = await testEIP20CoGateway.progressMint(
      messageHash,
      unlockSecret,
      {from: facilitator},
    );
    
    let facilitatorBalance = await testUtilityToken.balanceOf(facilitator);
    let beneficiaryBalance = await testUtilityToken.balanceOf(beneficiary);
    
    assert.strictEqual(
      beneficiaryBalance.eq(amount),
      true,
      `Balance for beneficiary should be ${amount}`,
    );
    
    assert.strictEqual(
      facilitatorBalance.eq(new BN(0)),
      true,
      'Facilitator reward should be zero',
    );
    
    let expectedEvent = {
      MintProgressed: {
        _messageHash: messageHash,
        _staker: staker,
        _stakeAmount: amount,
        _mintedAmount: amount,
        _rewardAmount: new BN(0),
        _proofProgress: false,
        _unlockSecret: unlockSecret
      }
    };
    
    assert.equal(
      response.receipt.status,
      1,
      'Receipt status is unsuccessful.',
    );
    
    let eventData = response.logs;
    Utils.validateEvents(eventData, expectedEvent);
    
  });
  
  it('should fail when messagehash is zero', async function () {
    
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    
    messageHash = zeroBytes;
    
    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(
        messageHash,
        unlockSecret,
        {from: facilitator},
      ),
      'Message hash must not be zero.',
    );
    
  });
  
  it('should fail when message status is declared revocation', async function () {
    
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );
    
    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(
        messageHash,
        unlockSecret,
        {from: facilitator},
      ),
      'Message on target status must be Declared.',
    );
    
  });
  
  it('should fail when message status is revoked', async function () {
    
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Revoked,
    );
    
    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(
        messageHash,
        unlockSecret,
        {from: facilitator},
      ),
      'Message on target status must be Declared.',
    );
    
  });
  
  it('should fail when message status is undeclared', async function () {
    
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Undeclared,
    );
    
    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(
        messageHash,
        unlockSecret,
        {from: facilitator},
      ),
      'Message on target status must be Declared.',
    );
    
  });
  
  it('should fail when unlock secret is invalid', async function () {
    
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Undeclared,
    );
    
    unlockSecret = zeroBytes;
    
    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(
        messageHash,
        unlockSecret,
        {from: facilitator},
      ),
      'Invalid unlock secret.',
    );
    
  });
  
  it('should fail when message status is already progressed', async function () {
    
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    
    await testEIP20CoGateway.progressMint(
      messageHash,
      unlockSecret,
      {from: facilitator},
    );
    
    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(
        messageHash,
        unlockSecret,
        {from: facilitator},
      ),
      'Message on target status must be Declared.',
    );
    
  });
  
});

