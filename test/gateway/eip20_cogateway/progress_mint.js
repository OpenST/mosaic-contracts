// Copyright 2019 OpenST Ltd.
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
const Utils = require('../../test_lib/utils');
const CoGatewayUtils = require('./helpers/co_gateway_utils.js');

const TestEIP20CoGateway = artifacts.require('TestEIP20CoGateway');
const TestUtilityToken = artifacts.require('TestUtilityToken');
const messageBus = require('../../test_lib/message_bus.js');

let valueToken;
let burner;
let organization;
let dummyStateRootProvider;
let gateway;
let testUtilityToken;
let bountyAmount;
let staker;

const symbol = 'OST';
const name = 'Simple Token';
const decimals = 18;
const zeroBytes = Utils.ZERO_BYTES32;
const { MessageStatusEnum } = messageBus;

async function setup(accounts) {
  [valueToken, organization, gateway, staker, burner, dummyStateRootProvider] = accounts;
  testUtilityToken = await TestUtilityToken.new(
    valueToken,
    symbol,
    name,
    decimals,
    organization,
  );
  bountyAmount = new BN(100);
}

contract('EIP20CoGateway.progressMint() ', (accounts) => {
  const beneficiary = accounts[4];
  const nonce = new BN(1);
  const hashLockObj = Utils.generateHashLock();
  const facilitator = accounts[5];

  let amount = new BN(200);
  let gasPrice;
  let gasLimit;
  let intentHash;
  let hashLock;
  let unlockSecret;
  let testEIP20CoGateway;
  let messageHash;

  beforeEach(async () => {
    await setup(accounts);
    amount = new BN(200);
    hashLock = hashLockObj.l;
    unlockSecret = hashLockObj.s;
    gasPrice = new BN(10);
    gasLimit = new BN(10);

    testEIP20CoGateway = await TestEIP20CoGateway.new(
      valueToken,
      testUtilityToken.address,
      dummyStateRootProvider,
      bountyAmount,
      organization,
      gateway,
      burner,
    );

    intentHash = CoGatewayUtils.hashRedeemIntent(
      amount,
      beneficiary,
      testEIP20CoGateway.address,
    );

    await testUtilityToken.setCoGatewayAddress(testEIP20CoGateway.address);

    messageHash = await testEIP20CoGateway.setMessage.call(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      staker,
      hashLock,
    );
    await testEIP20CoGateway.setMessage(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      staker,
      hashLock,
    );

    await testEIP20CoGateway.setMints(messageHash, beneficiary, amount);
  });

  it('should progress mint for non-zero facilitator reward', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    const progressMintValues = await testEIP20CoGateway.progressMint.call(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const expectedMintedToken = new BN(100);

    const expectedReward = new BN(100);

    assert.strictEqual(
      progressMintValues.beneficiary_,
      beneficiary,
      `Beneficiary address should be ${beneficiary}`,
    );

    assert.strictEqual(
      amount.eq(progressMintValues.stakeAmount_),
      true,
      `Staked amount is ${progressMintValues.stakeAmount_.toString(10)} and expected is `
      + `${amount.toString(10)}.`,
    );

    assert.strictEqual(
      expectedMintedToken.eq(progressMintValues.mintedAmount_),
      true,
      `Minted amount is ${progressMintValues.mintedAmount_.toString(10)} and expected is `
      + `${expectedMintedToken.toString(10)}.`,
    );

    assert.strictEqual(
      expectedReward.eq(progressMintValues.rewardAmount_),
      true,
      `Reward to facilitator is ${progressMintValues.rewardAmount_.toString(10)} and expected is `
      + `${expectedReward.toString(10)}.`,
    );

    const response = await testEIP20CoGateway.progressMint(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const facilitatorBalance = await testUtilityToken.balanceOf(facilitator);
    const beneficiaryBalance = await testUtilityToken.balanceOf(beneficiary);

    assert.strictEqual(
      facilitatorBalance.eq(expectedReward),
      true,
      `Facilitator reward is ${facilitatorBalance.toString(10)} and expected is `
      + `${expectedReward.toString(10)}.`,
    );

    assert.strictEqual(
      beneficiaryBalance.eq(amount.sub(expectedReward)),
      true,
      `Beneficiary balance is ${beneficiaryBalance.toString(10)} and expected is `
      + `${amount.sub(expectedReward).toString(10)}.`,
    );

    const expectedEvent = {
      MintProgressed: {
        _messageHash: messageHash,
        _staker: staker,
        _beneficiary: beneficiary,
        _stakeAmount: amount,
        _mintedAmount: expectedMintedToken,
        _rewardAmount: expectedReward,
        _proofProgress: false,
        _unlockSecret: unlockSecret,
      },
    };

    assert.equal(
      response.receipt.status,
      1,
      'Receipt status is unsuccessful.',
    );

    const eventData = response.logs;
    Utils.validateEvents(eventData, expectedEvent);
  });

  it('should progress mint for zero facilitator reward', async () => {
    gasPrice = new BN(0);

    messageHash = await testEIP20CoGateway.setMessage.call(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      staker,
      hashLock,
    );

    await testEIP20CoGateway.setMessage(
      intentHash,
      nonce,
      gasPrice,
      gasLimit,
      staker,
      hashLock,
    );
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );
    await testEIP20CoGateway.setMints(messageHash, beneficiary, amount);

    const response = await testEIP20CoGateway.progressMint(
      messageHash,
      unlockSecret,
      { from: facilitator },
    );

    const facilitatorBalance = await testUtilityToken.balanceOf(facilitator);
    const beneficiaryBalance = await testUtilityToken.balanceOf(beneficiary);

    assert.strictEqual(
      beneficiaryBalance.eq(amount),
      true,
      `Beneficiary balance is ${beneficiaryBalance.toString(10)} and expected is ${amount}`,
    );

    assert.strictEqual(
      facilitatorBalance.eq(new BN(0)),
      true,
      `Facilitator reward is ${facilitatorBalance.toString(10)} and expected is zero`,
    );

    const expectedEvent = {
      MintProgressed: {
        _messageHash: messageHash,
        _staker: staker,
        _beneficiary: beneficiary,
        _stakeAmount: amount,
        _mintedAmount: amount,
        _rewardAmount: new BN(0),
        _proofProgress: false,
        _unlockSecret: unlockSecret,
      },
    };

    assert.equal(
      response.receipt.status,
      1,
      'Receipt status is unsuccessful.',
    );

    const eventData = response.logs;
    Utils.validateEvents(eventData, expectedEvent);
  });

  it('should fail when messagehash is zero', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    messageHash = zeroBytes;

    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(messageHash, unlockSecret, {
        from: facilitator,
      }),
      'Message hash must not be zero.',
    );
  });

  it('should fail when message status is declared revocation', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(messageHash, unlockSecret, {
        from: facilitator,
      }),
      'Message on target status must be Declared.',
    );
  });

  it('should fail when message status is revoked', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(messageHash, unlockSecret, {
        from: facilitator,
      }),
      'Message on target status must be Declared.',
    );
  });

  it('should fail when message status is undeclared', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Undeclared,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(messageHash, unlockSecret, {
        from: facilitator,
      }),
      'Message on target status must be Declared.',
    );
  });

  it('should fail when unlock secret is invalid', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Undeclared,
    );

    unlockSecret = zeroBytes;

    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(messageHash, unlockSecret, {
        from: facilitator,
      }),
      'Invalid unlock secret.',
    );
  });

  it('should fail when message status is already progressed', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    await testEIP20CoGateway.progressMint(messageHash, unlockSecret, {
      from: facilitator,
    });

    await Utils.expectRevert(
      testEIP20CoGateway.progressMint(messageHash, unlockSecret, {
        from: facilitator,
      }),
      'Message on target status must be Declared.',
    );
  });
});
