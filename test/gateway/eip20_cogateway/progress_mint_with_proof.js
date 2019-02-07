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
const TestData = require('./test_data/stake_progressed_1');
const TestDataWithZeroGasPrice = require('./test_data/stake_progressed_3');
const messageBus = require('../../test_lib/message_bus.js');

const TestEIP20CoGateway = artifacts.require('TestEIP20CoGateway');
const TestUtilityToken = artifacts.require('TestUtilityToken');
const { MessageStatusEnum } = messageBus;

async function getMaxReward(stubData) {
  const gasPrice = new BN(stubData.gateway.stake.params.gasPrice, 16);
  const gasLimit = new BN(stubData.gateway.stake.params.gasLimit, 16);
  const maxReward = new BN(gasPrice * gasLimit);

  return maxReward;
}

contract('EIP20CoGateway.progressMintWithProof() ', (accounts) => {
  const facilitator = accounts[5];

  let intentHash;
  let params;
  let testUtilityToken;
  let testEIP20CoGateway;
  let messageHash;

  beforeEach(async () => {
    const valueToken = accounts[0];
    const burner = accounts[10];
    const bountyAmount = new BN(100);
    const symbol = 'OST';
    const name = 'Simple Token';
    const decimals = 18;

    testUtilityToken = await TestUtilityToken.new(
      TestData.contracts.mockToken,
      symbol,
      name,
      decimals,
      TestData.contracts.organization,
    );

    params = TestData.gateway.stake.params;
    params.amount = new BN(params.amount, 16);
    params.nonce = new BN(params.nonce, 16);
    params.gasPrice = new BN(params.gasPrice, 16);
    params.gasLimit = new BN(params.gasLimit, 16);
    params.blockNumber = new BN(TestData.gateway.stake.return_value.block_number, 16);
    params.storageHash = TestData.gateway.stake.proof_data.storageHash;
    params.serializedProof = TestData.gateway.stake.proof_data.storageProof[0].serializedProof;

    testEIP20CoGateway = await TestEIP20CoGateway.new(
      valueToken,
      testUtilityToken.address,
      TestData.contracts.anchor,
      bountyAmount,
      TestData.contracts.organization,
      TestData.contracts.gateway,
      burner,
    );

    intentHash = CoGatewayUtils.hashStakeIntent(
      params.amount,
      params.beneficiary,
      TestData.contracts.gateway,
    );

    await testUtilityToken.setCoGatewayAddress(testEIP20CoGateway.address);

    messageHash = messageBus.messageDigest(
      intentHash,
      params.nonce,
      params.gasPrice,
      params.gasLimit,
      params.staker,
      params.hashLock,
    );

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    await testEIP20CoGateway.setMessage(
      intentHash,
      params.nonce,
      params.gasPrice,
      params.gasLimit,
      params.staker,
      params.hashLock,
    );

    await testEIP20CoGateway.setMints(
      messageHash,
      params.beneficiary,
      params.amount,
    );

    await testEIP20CoGateway.setStorageRoot(
      params.blockNumber,
      params.storageHash,
    );
  });

  it('should emit event MintProgressed', async () => {
    const estimatedReward = await getMaxReward(TestData);
    const estimatedStakeAmount = params.amount.sub(estimatedReward);

    const response = await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      params.serializedProof,
      params.blockNumber,
      MessageStatusEnum.Declared,
      { from: facilitator },
    );

    const expectedEvent = {
      MintProgressed: {
        _messageHash: messageHash,
        _staker: params.staker,
        _beneficiary: params.beneficiary,
        _stakeAmount: params.amount,
        _mintedAmount: estimatedStakeAmount,
        _rewardAmount: estimatedReward,
        _proofProgress: true,
        _unlockSecret: Utils.ZERO_BYTES32,
      },
    };

    const eventData = response.logs;
    Utils.validateEvents(eventData, expectedEvent);
  });

  it('should return correct params', async () => {
    const response = await testEIP20CoGateway.progressMintWithProof.call(
      messageHash,
      params.serializedProof,
      params.blockNumber,
      MessageStatusEnum.Declared,
      { from: facilitator },
    );

    assert.strictEqual(
      response.beneficiary_,
      params.beneficiary,
      `Beneficiary address from response is ${response.beneficiary_} and expected value is ${params.beneficiary}`,
    );

    assert.strictEqual(
      params.amount.eq(response.stakeAmount_),
      true,
      `Staked amount from response is ${response.stakeAmount_} and expected value is ${params.amount.toString(10)}.`,
    );

    const expectedReward = await getMaxReward(TestData);
    assert.strictEqual(
      expectedReward.eq(response.rewardAmount_),
      true,
      `Reward to facilitator from response is ${response.rewardAmount_} and expected value is ${expectedReward.toString(10)}.`,
    );

    const expectedStakedAmount = params.amount.sub(expectedReward);
    assert.strictEqual(
      expectedStakedAmount.eq(response.mintedAmount_),
      true,
      `Minted amount from response is ${response.mintedAmount_} and expected value is ${expectedStakedAmount.toString(10)}.`,
    );
  });

  it('should progress mint for non-zero facilitator reward when message status at source is declared', async () => {
    const initialFacilitatorBalance = await testUtilityToken.balanceOf(facilitator);

    await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      params.serializedProof,
      params.blockNumber,
      MessageStatusEnum.Declared,
      { from: facilitator },
    );

    const expectedRewardAmount = await getMaxReward(TestData);
    const finalFacilitatorBalance = await testUtilityToken.balanceOf(facilitator);

    assert.strictEqual(
      finalFacilitatorBalance.sub(initialFacilitatorBalance).eq(expectedRewardAmount),
      true,
      `Facilitator got the reward ${(finalFacilitatorBalance.sub(initialFacilitatorBalance)).toString(10)} `
      + `and expected is ${expectedRewardAmount.toString(10)}.`,
    );
  });

  it('should progress mint for non-zero facilitator reward when message status at source is progressed', async () => {
    const initialFacilitatorBalance = await testUtilityToken.balanceOf(facilitator);
    const initialBeneficiaryBalance = await testUtilityToken.balanceOf(params.beneficiary);

    await testEIP20CoGateway.setStorageRoot(
      new BN(TestData.gateway.progress_stake.return_value.block_number, 16),
      TestData.gateway.progress_stake.proof_data.storageHash,
    );

    await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      TestData.gateway.progress_stake.proof_data.storageProof[0].serializedProof,
      new BN(TestData.gateway.progress_stake.return_value.block_number, 16),
      MessageStatusEnum.Progressed,
      { from: facilitator },
    );

    const expectedRewardAmount = await getMaxReward(TestData);
    const finalFacilitatorBalance = await testUtilityToken.balanceOf(facilitator);
    const finalBeneficiaryBalance = await testUtilityToken.balanceOf(params.beneficiary);

    assert.strictEqual(
      finalFacilitatorBalance.sub(initialFacilitatorBalance).eq(expectedRewardAmount),
      true,
      `Facilitator got the reward ${finalFacilitatorBalance.sub(initialFacilitatorBalance).toString(10)} `
      + `and expected is ${expectedRewardAmount.add(initialFacilitatorBalance).toString(10)}.`,
    );

    const stakedAmount = new BN(params.amount, 16);

    assert.strictEqual(
      initialBeneficiaryBalance
        .add(stakedAmount.sub(expectedRewardAmount))
        .eq(finalBeneficiaryBalance),
      true,
      `Beneficiary balance ${finalBeneficiaryBalance} must be equal to `
      + `${initialBeneficiaryBalance.add(stakedAmount).sub(expectedRewardAmount)}.`,
    );
  });

  it('should mint tokens to beneficiary', async () => {
    const initialBeneficiaryBalance = await testUtilityToken.balanceOf(params.beneficiary);

    await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      params.serializedProof,
      params.blockNumber,
      MessageStatusEnum.Declared,
      { from: facilitator },
    );

    const expectedRewardAmount = await getMaxReward(TestData);
    const finalBeneficiaryBalance = await testUtilityToken.balanceOf(params.beneficiary);
    const stakedAmount = new BN(params.amount, 16);

    assert.strictEqual(
      initialBeneficiaryBalance
        .add(stakedAmount.sub(expectedRewardAmount))
        .eq(finalBeneficiaryBalance),
      true,
      `Beneficiary balance ${finalBeneficiaryBalance.toString(10)} must be equal to`
      + `${initialBeneficiaryBalance.add(stakedAmount).sub(expectedRewardAmount)}.`,
    );
  });

  it('should progress mint for zero facilitator reward', async () => {
    intentHash = CoGatewayUtils.hashStakeIntent(
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
      new BN(TestDataWithZeroGasPrice.gateway.stake.params.amount, 16),
    );

    await testEIP20CoGateway.setStorageRoot(
      new BN(TestDataWithZeroGasPrice.gateway.stake.return_value.block_number, 16),
      TestDataWithZeroGasPrice.gateway.stake.proof_data.storageHash,
    );

    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Declared,
    );

    const initialFacilitatorBalance = await testUtilityToken.balanceOf(facilitator);

    await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      TestDataWithZeroGasPrice.gateway.stake.proof_data.storageProof[0].serializedProof,
      new BN(TestDataWithZeroGasPrice.gateway.stake.return_value.block_number, 16),
      MessageStatusEnum.Declared,
      { from: facilitator },
    );

    const expectedRewardAmount = await getMaxReward(TestDataWithZeroGasPrice);
    const finalFacilitatorBalance = await testUtilityToken.balanceOf(facilitator);

    assert.strictEqual(
      finalFacilitatorBalance.add(initialFacilitatorBalance).eq(expectedRewardAmount),
      true,
      `Facilitator got the reward ${finalFacilitatorBalance.sub(initialFacilitatorBalance).toString(10)}`
      + ` and expected is ${expectedRewardAmount.add(initialFacilitatorBalance).toString(10)}.`,
    );
  });

  it('should fail when messagehash is zero', async () => {
    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        Utils.NULL_ADDRESS,
        params.serializedProof,
        params.blockNumber,
        MessageStatusEnum.Declared,
        { from: facilitator },
      ),
      'Message hash must not be zero',
    );
  });

  it('should fail when rlp of parent nodes is zero', async () => {
    const rlpParentNodes = '0x';
    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        messageHash,
        rlpParentNodes,
        params.blockNumber,
        MessageStatusEnum.Declared,
        { from: facilitator },
      ),
      'RLP parent nodes must not be zero',
    );
  });

  it('should fail when storage root for block height is not set', async () => {
    const blockHeight = new BN(1);
    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        messageHash,
        params.serializedProof,
        blockHeight,
        MessageStatusEnum.Declared,
        { from: facilitator },
      ),
      'Storage root must not be zero',
    );
  });

  it('should fail when message status is declared revocation', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        messageHash,
        params.serializedProof,
        params.blockNumber,
        MessageStatusEnum.Declared,
        { from: facilitator },
      ),
      'Message on target must be Declared.',
    );
  });

  it('should fail when message status is revoked', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Revoked,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        messageHash,
        params.serializedProof,
        params.blockNumber,
        MessageStatusEnum.Declared,
        { from: facilitator },
      ),
      'Message on target must be Declared.',
    );
  });

  it('should fail when message status is undeclared', async () => {
    await testEIP20CoGateway.setInboxStatus(
      messageHash,
      MessageStatusEnum.Undeclared,
    );

    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        messageHash,
        params.serializedProof,
        params.blockNumber,
        MessageStatusEnum.Declared,
        { from: facilitator },
      ),
      'Message on target must be Declared.',
    );
  });

  it('should fail when message status at source is DeclaredRevocation', async () => {
    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        messageHash,
        params.serializedProof,
        params.blockNumber,
        MessageStatusEnum.DeclaredRevocation,
        { from: facilitator },
      ),
      'Message on source must be Declared or Progressed.',
    );
  });

  it('should fail when message status at source is Revoked', async () => {
    await Utils.expectRevert(
      testEIP20CoGateway.progressMintWithProof(
        messageHash,
        params.serializedProof,
        params.blockNumber,
        MessageStatusEnum.Revoked,
        { from: facilitator },
      ),
      'Message on source must be Declared or Progressed.',
    );
  });

  it('should fail when message status is already progressed', async () => {
    await testEIP20CoGateway.progressMintWithProof(
      messageHash,
      params.serializedProof,
      params.blockNumber,
      MessageStatusEnum.Declared,
      { from: facilitator },
    );

    await Utils.expectRevert(testEIP20CoGateway.progressMintWithProof(
      messageHash,
      params.serializedProof,
      params.blockNumber,
      MessageStatusEnum.Progressed,
      { from: facilitator },
    ),
      'Message on target must be Declared.');
  });
});
