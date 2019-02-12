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

const Gateway = artifacts.require('./TestEIP20Gateway.sol');
const MockOrganization = artifacts.require('MockOrganization.sol');
const MockToken = artifacts.require('MockToken');

const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');
const GatewayUtils = require('./helpers/gateway_utils');

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;

const proofData = require('../../../test/data/stake_progressed_1.json');

const { MessageStatusEnum } = messageBus;

contract('EIP20Gateway.progressStakeWithProof()', (accounts) => {
  let gateway;
  let mockToken;
  let baseToken;
  let stakeData;
  let progressStakeParams;
  let bountyAmount;
  let penaltyAmount;

  const PENALTY_MULTIPLIER = 1.5;

  const setStorageRoot = async () => {
    let blockNumber = new BN(proofData.co_gateway.confirm_stake_intent.proof_data.block_number);
    let storageRoot = proofData.co_gateway.confirm_stake_intent.proof_data.storageHash;
    await gateway.setStorageRoot(blockNumber, storageRoot);

    blockNumber = new BN(proofData.co_gateway.progress_mint.proof_data.block_number);
    storageRoot = proofData.co_gateway.progress_mint.proof_data.storageHash;
    await gateway.setStorageRoot(blockNumber, storageRoot);
  };

  const prepareTestData = async (stubData) => {
    const stakeParams = stubData.gateway.stake.params;

    stakeData = {
      amount: new BN(stakeParams.amount, 16),
      beneficiary: stakeParams.beneficiary,
      gasPrice: new BN(stakeParams.gasPrice, 16),
      gasLimit: new BN(stakeParams.gasLimit, 16),
      nonce: new BN(stakeParams.nonce, 16),
      hashLock: stakeParams.hashLock,
      messageHash: stubData.gateway.stake.return_value.returned_value.messageHash_,
      staker: stakeParams.staker,
    };

    stakeData.intentHash = GatewayUtils.hashStakeIntent(
      stakeData.amount,
      stakeData.beneficiary,
      stubData.contracts.gateway,
    );

    await gateway.setStake(
      stakeData.messageHash,
      stakeData.beneficiary,
      stakeData.amount,
    );

    await gateway.setMessage(
      stakeData.intentHash,
      stakeData.nonce,
      stakeData.gasPrice,
      stakeData.gasLimit,
      stakeData.staker,
      stakeData.hashLock,
    );

    await gateway.setOutboxStatus(
      stakeData.messageHash,
      MessageStatusEnum.Declared,
    );

    progressStakeParams = {
      messageHash: stakeData.messageHash,
      rlpParentNodes: stubData
        .co_gateway
        .confirm_stake_intent
        .proof_data
        .storageProof[0]
        .serializedProof,
      blockHeight: new BN(stubData.co_gateway.confirm_stake_intent.proof_data.block_number),
      messageStatus: MessageStatusEnum.Declared,
    };

    await mockToken.transfer(gateway.address, stakeData.amount, { from: accounts[0] });
    await baseToken.transfer(gateway.address, bountyAmount, { from: accounts[0] });
  };


  beforeEach(async () => {
    mockToken = await MockToken.new({ from: accounts[0] });
    baseToken = await MockToken.new({ from: accounts[0] });

    const owner = accounts[2];
    const worker = accounts[7];
    const organization = await MockOrganization.new(
      owner,
      worker,
      { from: accounts[0] },
    );

    const coreAddress = accounts[5];
    const burner = NullAddress;

    bountyAmount = new BN(proofData.gateway.constructor.bounty);
    penaltyAmount = bountyAmount.muln(PENALTY_MULTIPLIER);

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      organization.address,
      burner,
    );

    await prepareTestData(proofData);
  });

  it('should fail when message hash is zero', async () => {
    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        ZeroBytes,
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Message hash must not be zero.',
    );
  });

  it('should fail when storage proof is zero', async () => {
    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        '0x',
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'RLP encoded parent nodes must not be zero.',
    );
  });

  it('should fail when storage proof is incorrect', async () => {
    await setStorageRoot();

    /*
     * Stake proof data is passed instead of confirm stake intent proof data.
     * This makes the proof data incorrect.
     */
    const storageProof = proofData.gateway.stake.proof_data.storageProof[0].serializedProof;

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        storageProof,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Merkle proof verification failed.',
    );
  });

  it('should fail when storage proof is invalid', async () => {
    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        '0x1234',
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'VM Exception while processing transaction: revert',
    );
  });

  it('should fail when storage root is not committed for given block height',
    async () => {
      // Here setStorageRoot() is not called, so the storage root will not be available.

      await Utils.expectRevert(
        gateway.progressStakeWithProof(
          progressStakeParams.messageHash,
          progressStakeParams.rlpParentNodes,
          progressStakeParams.blockHeight,
          progressStakeParams.messageStatus,
        ),
        'Storage root must not be zero.',
      );
    });

  it('should fail for undeclared message', async () => {
    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        web3.utils.sha3('dummy'),
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Status of message on source must be Declared or DeclareRevocation.',
    );
  });

  it('should fail for revoked message', async () => {
    await gateway.setOutboxStatus(
      stakeData.messageHash,
      MessageStatusEnum.Revoked,
    );

    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Status of message on source must be Declared or DeclareRevocation.',
    );
  });

  it('should fail for already progressed message', async () => {
    await setStorageRoot();

    await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      progressStakeParams.rlpParentNodes,
      progressStakeParams.blockHeight,
      progressStakeParams.messageStatus,
    );

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Status of message on source must be Declared or DeclareRevocation.',
    );
  });

  it('should fail when the message status in source is declared revocation '
    + 'and in the target is declared', async () => {
    await gateway.setOutboxStatus(
      stakeData.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Message on target must be Progressed.',
    );
  });

  it('should pass when the message status in source is declared revocation '
    + 'and in the target is progressed', async () => {
    await gateway.setOutboxStatus(
      stakeData.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    // Fund Gateway with enough tokens that it can return penalty.
    await baseToken.transfer(gateway.address, penaltyAmount, { from: accounts[0] });

    await setStorageRoot();

    const result = await gateway.progressStakeWithProof.call(
      progressStakeParams.messageHash,
      proofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
      new BN(proofData.co_gateway.progress_mint.proof_data.block_number),
      MessageStatusEnum.Progressed,
    );

    assert.strictEqual(
      result.staker_,
      stakeData.staker,
      `Staker address must be equal to ${stakeData.staker}.`,
    );
    assert.strictEqual(
      result.stakeAmount_.eq(stakeData.amount),
      true,
      `Stake amount must be equal to ${stakeData.amount.toString(10)}.`,
    );

    const tx = await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      proofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
      new BN(proofData.co_gateway.progress_mint.proof_data.block_number),
      MessageStatusEnum.Progressed,
    );

    assert.equal(
      tx.receipt.status,
      1,
      'Receipt status is unsuccessful',
    );
  });

  it('should pass when the message status at source and target is declared',
    async () => {
      await setStorageRoot();

      const result = await gateway.progressStakeWithProof.call(
        progressStakeParams.messageHash,
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        MessageStatusEnum.Declared,
      );

      assert.strictEqual(
        result.staker_,
        stakeData.staker,
        `Staker address must be equal to ${stakeData.staker}.`,
      );

      assert.strictEqual(
        result.stakeAmount_.eq(stakeData.amount),
        true,
        `Stake amount must be equal to ${stakeData.amount.toString(10)}.`,
      );

      const tx = await gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        MessageStatusEnum.Declared,
      );

      assert.equal(
        tx.receipt.status,
        1,
        'Receipt status is unsuccessful',
      );
    });

  it('should pass when the message status at source is declared and at target '
    + 'is progressed',
  async () => {
    await setStorageRoot();

    const result = await gateway.progressStakeWithProof.call(
      progressStakeParams.messageHash,
      proofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
      new BN(proofData.co_gateway.progress_mint.proof_data.block_number),
      MessageStatusEnum.Progressed,
    );

    assert.strictEqual(
      result.staker_,
      stakeData.staker,
      `Staker address must be equal to ${stakeData.staker}.`,
    );
    assert.strictEqual(
      result.stakeAmount_.eq(stakeData.amount),
      true,
      `Stake amount must be equal to ${stakeData.amount.toString(10)}.`,
    );

    const tx = await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      proofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
      new BN(proofData.co_gateway.progress_mint.proof_data.block_number),
      MessageStatusEnum.Progressed,
    );

    assert.strictEqual(
      tx.receipt.status,
      true,
      'Receipt status is unsuccessful.',
    );
  });

  it('should emit StakeProgressed event', async () => {
    await setStorageRoot();

    const tx = await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      progressStakeParams.rlpParentNodes,
      progressStakeParams.blockHeight,
      MessageStatusEnum.Declared,
    );

    const event = EventDecoder.getEvents(tx, gateway);
    const eventData = event.StakeProgressed;

    assert.isDefined(
      eventData,
      'Event `StakeProgressed` must be emitted.',
    );
    assert.strictEqual(
      eventData._messageHash,
      progressStakeParams.messageHash,
      `Message hash ${eventData._messageHash} from the event must be equalt to ${progressStakeParams.messageHash}.`,
    );
    assert.strictEqual(
      eventData._staker,
      stakeData.staker,
      `Staker address ${eventData._staker} from the event must be equal to ${stakeData.staker}.`,
    );
    assert.strictEqual(
      eventData._stakerNonce.eq(stakeData.nonce),
      true,
      `Staker nonce ${eventData._stakerNonce.toString(10)} from the event must be equal to ${stakeData.nonce.toString(10)}.`,
    );
    assert.strictEqual(
      eventData._amount.eq(stakeData.amount),
      true,
      `Stake amount ${eventData._amount.toString(10)} from event must be equal to ${stakeData.amount.toString(10)}.`,
    );
    assert.strictEqual(
      eventData._proofProgress,
      true,
      'Proof progress flag should be true.',
    );
    assert.strictEqual(
      eventData._unlockSecret,
      ZeroBytes,
      'Unlock secret must be zero.',
    );
  });

  it('should return bounty to facilitator', async () => {
    const caller = accounts[0];

    const callerInitialBaseTokenBalance = await baseToken.balanceOf(caller);
    const gatewayInitialBaseTokenBalance = await baseToken.balanceOf(gateway.address);

    await setStorageRoot();

    await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      progressStakeParams.rlpParentNodes,
      progressStakeParams.blockHeight,
      MessageStatusEnum.Declared,
    );

    const callerFinalBaseTokenBalance = await baseToken.balanceOf(caller);
    const gatewayFinalBaseTokenBalance = await baseToken.balanceOf(gateway.address);

    assert.strictEqual(
      callerFinalBaseTokenBalance.eq(callerInitialBaseTokenBalance.add(bountyAmount)),
      true,
      `Facilitator balance ${callerFinalBaseTokenBalance.toString(10)} should be equal to ${callerInitialBaseTokenBalance.add(bountyAmount).toString(10)}.`,
    );

    assert.strictEqual(
      gatewayFinalBaseTokenBalance.eq(gatewayInitialBaseTokenBalance.sub(bountyAmount)),
      true,
      `Gateway base balance ${gatewayFinalBaseTokenBalance.toString(10)} should be equal to ${gatewayInitialBaseTokenBalance.sub(bountyAmount).toString(10)}.`,
    );
  });

  it('Should lock staked token into stakeVault', async () => {
    const stakeVault = await gateway.stakeVault.call();

    const gatewayInitialTokenBalance = await mockToken.balanceOf(gateway.address);
    const stakeVaultInitialTokenBalance = await mockToken.balanceOf(stakeVault);

    await setStorageRoot();

    await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      progressStakeParams.rlpParentNodes,
      progressStakeParams.blockHeight,
      MessageStatusEnum.Declared,
    );

    const gatewayFinalTokenBalance = await mockToken.balanceOf(gateway.address);
    const stakeVaultFinalTokenBalance = await mockToken.balanceOf(stakeVault);

    assert.strictEqual(
      gatewayFinalTokenBalance.eq(gatewayInitialTokenBalance.sub(stakeData.amount)),
      true,
      `Gateway token balance ${gatewayFinalTokenBalance.toString(10)} should be equal to ${gatewayInitialTokenBalance.sub(stakeData.amount).toString(10)}.`,
    );

    assert.strictEqual(
      stakeVaultFinalTokenBalance.eq(stakeVaultInitialTokenBalance.add(stakeData.amount)),
      true,
      `Stake vault token balance ${stakeVaultFinalTokenBalance.toString(10)} should be equal to ${stakeVaultInitialTokenBalance.add(stakeData.amount).toString(10)}.`,
    );
  });

  it('should return penalty to staker when the message status in source is '
    + 'declared revocation and in the target is progressed', async () => {
    const stakeVault = await gateway.stakeVault.call();
    const caller = accounts[0];
    const { staker } = stakeData;

    await gateway.setOutboxStatus(
      stakeData.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    // Fund Gateway with enough tokens that it can return penalty.
    await baseToken.transfer(gateway.address, penaltyAmount, { from: accounts[0] });

    const callerInitialBaseTokenBalance = await baseToken.balanceOf(caller);
    const stakerInitialBaseTokenBalance = await baseToken.balanceOf(staker);
    const gatewayInitialTokenBalance = await mockToken.balanceOf(gateway.address);
    const gatewayInitialBaseTokenBalance = await baseToken.balanceOf(gateway.address);
    const stakeVaultInitialTokenBalance = await mockToken.balanceOf(stakeVault);

    await setStorageRoot();

    await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      proofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
      new BN(proofData.co_gateway.progress_mint.proof_data.block_number),
      MessageStatusEnum.Progressed,
    );

    const callerFinalBaseTokenBalance = await baseToken.balanceOf(caller);
    const stakerFinalBaseTokenBalance = await baseToken.balanceOf(staker);
    const gatewayFinalTokenBalance = await mockToken.balanceOf(gateway.address);
    const gatewayFinalBaseTokenBalance = await baseToken.balanceOf(gateway.address);
    const stakeVaultFinalTokenBalance = await mockToken.balanceOf(stakeVault);

    assert.strictEqual(
      callerFinalBaseTokenBalance.eq(callerInitialBaseTokenBalance.add(bountyAmount)),
      true,
      'Bounty should be returned to caller.',
    );

    assert.strictEqual(
      stakerFinalBaseTokenBalance.eq(stakerInitialBaseTokenBalance.add(penaltyAmount)),
      true,
      `Staker's base token balance ${stakerFinalBaseTokenBalance.toString(10)} must be equal to ${stakerInitialBaseTokenBalance.add(penaltyAmount).toString(10)}`,
    );

    assert.strictEqual(
      gatewayFinalTokenBalance.eq(gatewayInitialTokenBalance.sub(stakeData.amount)),
      true,
      'Gateway token balance should reduced by stake amount on successful '
        + 'progress stake.',
    );

    assert.strictEqual(
      gatewayFinalBaseTokenBalance.eq(
        gatewayInitialBaseTokenBalance.sub(bountyAmount).sub(penaltyAmount),
      ),
      true,
      `Gateway's base token balance ${gatewayFinalBaseTokenBalance.toString(10)} must be equal to ${gatewayInitialBaseTokenBalance.sub(bountyAmount).sub(penaltyAmount).toString(10)}.`,
    );

    assert.strictEqual(
      stakeVaultFinalTokenBalance.eq(stakeVaultInitialTokenBalance.add(stakeData.amount)),
      true,
      'Stake vault token balance should increase by stake amount on '
        + 'successful progress stake.',
    );
  });
});
