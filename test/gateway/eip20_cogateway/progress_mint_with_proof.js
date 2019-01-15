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
  coGatewayUtils = require('./helpers/co_gateway_utils.js'),
  TestData = require('./test_data/stake_progressed_1'),
  TestEIP20CoGateway = artifacts.require('TestEIP20CoGateway'),
  TestUtilityToken = artifacts.require('TestUtilityToken'),
  TestDataWithZeroGasPrice = require('./test_data/stake_progressed_3'),
  messageBus = require('../../test_lib/message_bus.js');

let MessageStatusEnum = messageBus.MessageStatusEnum;

let valueToken,
  burner,
  organization,
  gateway,
  testUtilityToken,
  bountyAmount,
  symbol = 'OST',
  name = 'Simple Token',
  decimals = 18,
  testEIP20CoGateway;

async function assertProgressMintWithProof(stubData, progressMintValues) {

  let expectedMintedToken = new BN(
    stubData.co_gateway.progress_mint.return_value.events.MintProgressed._mintedAmount,
    16
    ),
    expectedReward = new BN(
      stubData.co_gateway.progress_mint.return_value.events.MintProgressed._rewardAmount,
      16
    );

  assert.strictEqual(
    progressMintValues.beneficiary_,
    stubData.gateway.stake.params.beneficiary,
    `Beneficiary address should be ${stubData.gateway.stake.params.beneficiary}`,
  );

  amount = new BN(stubData.gateway.progress_stake.return_value.returned_value.stakeAmount_, 16);
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

  let response = await testEIP20CoGateway.progressMintWithProof(
    messageHash,
    stubData.gateway.stake.proof_data.storageProof[0].serializedProof,
    new BN(stubData.gateway.stake.return_value.block_number, 16),
    MessageStatusEnum.Declared,
    {from: facilitator},
  );

  let facilitatorBalance = await testUtilityToken.balanceOf(facilitator);
  let beneficiaryBalance = await testUtilityToken.balanceOf(stubData.gateway.stake.params.beneficiary);

  assert.strictEqual(
    facilitatorBalance.eq(expectedReward),
    true,
    `Facilitator reward should be ${expectedReward}.`,
  );

  assert.strictEqual(
    beneficiaryBalance.eq(expectedMintedToken),
    true,
    `Beneficiary balance should be ${amount.sub(expectedMintedToken)}.`
  );

  let mintProgressed = stubData.co_gateway.progress_mint.return_value.events.MintProgressed._mintedAmount;
  let expectedEvent = {
    MintProgressed: {
      _messageHash: mintProgressed._messageHash,
      _staker: mintProgressed._staker,
      _stakeAmount: mintProgressed._stakeAmount,
      _mintedAmount: expectedMintedToken,
      _rewardAmount: expectedReward,
      _proofProgress: true,
      _unlockSecret: mintProgressed._unlockSecret
    }
  };

  assert.equal(
    response.receipt.status,
    1,
    'Receipt status is unsuccessful.',
  );

  let eventData = response.logs;
  Utils.validateEvents(eventData, expectedEvent);

}

async function setup(accounts) {

  valueToken = accounts[0];
  burner = accounts[10];
  organization = accounts[2];
  gateway = accounts[3];
  testUtilityToken = await TestUtilityToken.new(
    valueToken,
    symbol,
    name,
    decimals,
    organization
  );

  bountyAmount = new BN(100);

  testEIP20CoGateway = await TestEIP20CoGateway.new(
    testUtilityToken.address,// make it value token or mocktoken
    testUtilityToken.address,
    TestData.contracts.anchor,
    bountyAmount,
    organization,
    TestData.contracts.gateway,
    burner,
  );
}

contract('EIP20CoGateway.progressMintWithProof() ', function (accounts) {

  let facilitator = accounts[5],
    intentHash,
    messageHash;

  beforeEach(async function () {

    await setup(accounts);

    intentHash = coGatewayUtils.hashStakeIntent(
      new BN(TestData.gateway.stake.params.amount, 16),
      TestData.gateway.stake.params.beneficiary,
      TestData.contracts.gateway,
    );

    await testUtilityToken.setCoGatewayAddress(testEIP20CoGateway.address);

    messageHash = await testEIP20CoGateway.setMessage.call(
      intentHash,
      new BN(TestData.gateway.stake.params.nonce, 16),
      new BN(TestData.gateway.stake.params.gasPrice, 16),
      new BN(TestData.gateway.stake.params.gasLimit, 16),
      TestData.gateway.stake.params.staker,
      TestData.gateway.stake.params.hashLock,
    );

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    await testEIP20CoGateway.setMessage(
      intentHash,
      new BN(TestData.gateway.stake.params.nonce, 16),
      new BN(TestData.gateway.stake.params.gasPrice, 16),
      new BN(TestData.gateway.stake.params.gasLimit, 16),
      TestData.gateway.stake.params.staker,
      TestData.gateway.stake.params.hashLock,
    );

    await testEIP20CoGateway.setMints(
      messageHash,
      TestData.gateway.stake.params.beneficiary,
      new BN(TestData.gateway.stake.params.amount, 16)
    );

    await testEIP20CoGateway.setStorageRoot(
      new BN(TestData.gateway.stake.return_value.block_number, 16),
      TestData.gateway.stake.proof_data.storageHash
    );

  });

  it('should progress mint for non-zero facilitator reward when message status at source is declared', async function () {

    let progressMintValues = await testEIP20CoGateway.progressMintWithProof.call(
      messageHash,
      TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
      new BN(TestData.gateway.stake.return_value.block_number, 16),
      MessageStatusEnum.Declared,
      {from: facilitator},
    );

    assertProgressMintWithProof(TestData, progressMintValues);

  });

  it('should progress mint for non-zero facilitator reward when message status at source is progressed', async function () {

    await testEIP20CoGateway.setStorageRoot(
      new BN(TestData.gateway.progress_stake.return_value.block_number, 16),
      TestData.gateway.progress_stake.proof_data.storageHash
    );
    let progressMintValues = await testEIP20CoGateway.progressMintWithProof.call(
      messageHash,
      TestData.gateway.progress_stake.proof_data.storageProof[0].serializedProof,
      new BN(TestData.gateway.progress_stake.return_value.block_number, 16),
      MessageStatusEnum.Progressed,
      {from: facilitator},
    );

    assertProgressMintWithProof(TestData, progressMintValues);

  });

  it('should progress mint for zero facilitator reward', async function () {

    intentHash = coGatewayUtils.hashStakeIntent(
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.amount, 16),
      TestDataWithZeroGasPrice.gateway.stake.params.beneficiary,
      TestDataWithZeroGasPrice.contracts.gateway,
    );

    messageHash = await testEIP20CoGateway.setMessage.call(
      intentHash,
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.nonce, 16),
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.gasPrice, 16),
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.gasLimit, 16),
      TestDataWithZeroGasPrice.gateway.stake.params.staker,
      TestDataWithZeroGasPrice.gateway.stake.params.hashLock,
    );

    await testEIP20CoGateway.setMessage(
      intentHash,
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.nonce, 16),
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.gasPrice, 16),
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.gasLimit, 16),
      TestDataWithZeroGasPrice.gateway.stake.params.staker,
      TestDataWithZeroGasPrice.gateway.stake.params.hashLock,
    );

    await testEIP20CoGateway.setMints(
      messageHash,
      TestDataWithZeroGasPrice.gateway.stake.params.beneficiary,
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.amount, 16)
    );

    await testEIP20CoGateway.setStorageRoot(
      new BN(TestDataWithZeroGasPrice.gateway.stake.return_value.block_number, 16),
      TestDataWithZeroGasPrice.gateway.stake.proof_data.storageHash
    );

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    let progressMintValues = await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      TestDataWithZeroGasPrice.gateway.stake.proof_data.storageProof[0].serializedProof,
      new BN(TestDataWithZeroGasPrice.gateway.stake.return_value.block_number, 16),
      MessageStatusEnum.Declared,
      {from: facilitator},
    );

    assertProgressMintWithProof(TestDataWithZeroGasPrice, progressMintValues);

  });

  it('should fail when messagehash is zero', async function () {

    messageHash = Utils.NULL_ADDRESS;

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.Declared,
        {from: facilitator},
      ),
      'Message hash must not be zero',
    );

  });

  it('should fail when rlp of parent nodes is zero', async function () {

    let rlpParentNodes = "0x";
    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        rlpParentNodes,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.Declared,
        {from: facilitator},
      ),
      'RLP parent nodes must not be zero',
    );

  });

  it('should fail when storage root for block height is not set', async function () {

    let blockHeight = new BN(1);
    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        blockHeight,
        MessageStatusEnum.Declared,
        {from: facilitator},
      ),
      'Storage root must not be zero',
    );

  });

  it('should fail when message status is declared revocation', async function () {

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.Declared,
        {from: facilitator},
      ),
      'Message on target must be Declared.',
    );

  });

  it('should fail when message status is revoked', async function () {

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.Declared,
        {from: facilitator},
      ),
      'Message on target must be Declared.',
    );

  });

  it('should fail when message status is undeclared', async function () {

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Undeclared,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.Declared,
        {from: facilitator},
      ),
      'Message on target must be Declared.',
    );

  });

  it('should fail when message status at source is DeclaredRevocation', async function () {

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.DeclaredRevocation,
        {from: facilitator},
      ),
      'Message on source must be Declared or Progressed.',
    );

  });

  it('should fail when message status at source is Revoked', async function () {

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.Revoked,
        {from: facilitator},
      ),
      'Message on source must be Declared or Progressed.',
    );

  });

  it('should fail when message status is undeclared', async function () {

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Undeclared,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof.call(
        messageHash,
        TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
        new BN(TestData.gateway.stake.return_value.block_number, 16),
        MessageStatusEnum.Declared,
        {from: facilitator},
      ),
      'Message on target must be Declared.',
    );

  });

  it('should fail when message status is already progressed', async function () {

    await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
      new BN(TestData.gateway.stake.return_value.block_number, 16),
      MessageStatusEnum.Declared,
      {from: facilitator},
    );

    await Utils.expectRevert(testEIP20CoGateway.progressMintWithProof(
      messageHash,
      TestData.gateway.stake.proof_data.storageProof[0].serializedProof,
      new BN(TestData.gateway.stake.return_value.block_number, 16),
      MessageStatusEnum.Declared,
      {from: facilitator},
      ),
      'Message on target must be Declared.',
    );

  });

});

