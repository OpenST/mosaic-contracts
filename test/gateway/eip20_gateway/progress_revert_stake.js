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

const revokedProofData = require('../../../test/data/stake_revoked_1.json');
const progressedProofData = require('../../../test/data/stake_progressed_1.json');

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;
const { MessageStatusEnum } = messageBus;

contract('EIP20Gateway.progressRevertStake()', (accounts) => {
  let gateway;
  let mockToken;
  let baseToken;
  let revertStakeParams;
  let bountyAmount;

  const setup = async (givenStakeParams) => {
    const stakeIntentHash = GatewayUtils.hashStakeIntent(
      givenStakeParams.amount,
      givenStakeParams.beneficiary,
      givenStakeParams.gatewayAddress,
    );

    await gateway.setStake(
      givenStakeParams.messageHash,
      givenStakeParams.beneficiary,
      givenStakeParams.amount,
    );

    await gateway.setMessage(
      stakeIntentHash,
      givenStakeParams.nonce,
      givenStakeParams.gasPrice,
      givenStakeParams.gasLimit,
      givenStakeParams.staker,
      givenStakeParams.hashLock,
    );

    await gateway.setOutboxStatus(
      givenStakeParams.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );
  };

  beforeEach(async () => {
    mockToken = await MockToken.new({ from: accounts[0] });
    baseToken = await MockToken.new({ from: accounts[0] });

    const owner = accounts[2];
    const worker = accounts[7];
    const organization = await MockOrganization.new(owner, worker, {
      from: accounts[0],
    });

    const coreAddress = accounts[5];
    const burner = NullAddress;

    bountyAmount = new BN(revokedProofData.gateway.constructor.bounty);

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      organization.address,
      burner,
    );

    const paramsData = revokedProofData.gateway.stake.params;

    revertStakeParams = {
      amount: new BN(paramsData.amount, 16),
      beneficiary: paramsData.beneficiary,
      gasPrice: new BN(paramsData.gasPrice, 16),
      gasLimit: new BN(paramsData.gasLimit, 16),
      nonce: new BN(paramsData.nonce, 16),
      hashLock: paramsData.hashLock,
      messageHash:
        revokedProofData.gateway.stake.return_value.returned_value
          .messageHash_,
      staker: paramsData.staker,
      rlpParentNodes:
        revokedProofData.co_gateway.confirm_revert_stake_intent.proof_data
          .storageProof[0].serializedProof,
      blockHeight: new BN(
        revokedProofData.co_gateway.confirm_revert_stake_intent.proof_data.block_number,
        16,
      ),
      gatewayAddress: revokedProofData.contracts.gateway,
      storageRoot:
        revokedProofData.co_gateway.confirm_revert_stake_intent.proof_data
          .storageHash,
    };

    await setup(revertStakeParams);

    await mockToken.transfer(gateway.address, revertStakeParams.amount, {
      from: accounts[0],
    });

    /*
     * Gateway should have bounty amount when stake was done and penalty amount
     * when revert stake was requested. So transfer bounty + penalty amount to
     * gateway for testing. penalty is 1.5 of bounty so total amount to
     * transfer is 2.5 the bounty amount.
     */
    await baseToken.transfer(gateway.address, bountyAmount.muln(2.5), {
      from: accounts[0],
    });
  });

  it('should fail when message hash is zero', async () => {
    await Utils.expectRevert(
      gateway.progressRevertStake(
        ZeroBytes,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Message hash must not be zero.',
    );
  });

  it('should fail when storage proof zero', async () => {
    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        '0x',
      ),
      'RLP parent nodes must not be zero.',
    );
  });

  it('should fail when storage proof is incorrect', async () => {
    const blockHeight = new BN(
      revokedProofData.co_gateway.confirm_stake_intent.proof_data.block_number,
      16,
    );
    const storageRoot = revokedProofData.co_gateway.confirm_stake_intent.proof_data.storageHash;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        blockHeight,
        revokedProofData.co_gateway.confirm_stake_intent.proof_data
          .storageProof[0].serializedProof,
      ),
      'Merkle proof verification failed.',
    );
  });

  it('should fail when storage proof is invalid', async () => {
    await gateway.setStorageRoot(
      revertStakeParams.blockHeight,
      revertStakeParams.storageRoot,
    );

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        '0x1245',
      ),
      'VM Exception while processing transaction: revert',
    );
  });

  it('should fail when storage root is not committed for given block height', async () => {
    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Storage root must not be zero.',
    );
  });

  it('should fail when message is undeclared', async () => {
    await Utils.expectRevert(
      gateway.progressRevertStake(
        web3.utils.sha3('dummy'),
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'StakeIntentHash must not be zero.',
    );
  });

  it('should fail when message is progressed', async () => {
    await gateway.setOutboxStatus(
      revertStakeParams.messageHash,
      MessageStatusEnum.Progressed,
    );

    await gateway.setStorageRoot(
      revertStakeParams.blockHeight,
      revertStakeParams.storageRoot,
    );

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Message status on source must be DeclaredRevocation.',
    );
  });

  it('should fail when message status of inbox at target is progressed', async () => {
    const paramsData = progressedProofData.gateway.stake.params;

    revertStakeParams = {
      amount: new BN(paramsData.amount, 16),
      beneficiary: paramsData.beneficiary,
      gasPrice: new BN(paramsData.gasPrice, 16),
      gasLimit: new BN(paramsData.gasLimit, 16),
      nonce: new BN(paramsData.nonce, 16),
      hashLock: paramsData.hashLock,
      messageHash:
        progressedProofData.gateway.stake.return_value.returned_value
          .messageHash_,
      staker: paramsData.staker,
      rlpParentNodes:
        progressedProofData.co_gateway.progress_mint.proof_data.storageProof[0]
          .serializedProof,
      blockHeight: new BN(
        progressedProofData.co_gateway.progress_mint.proof_data.block_number,
        16,
      ),
      gatewayAddress: progressedProofData.contracts.gateway,
      storageRoot:
        progressedProofData.co_gateway.progress_mint.proof_data.storageHash,
    };

    await setup(revertStakeParams);

    await mockToken.transfer(gateway.address, revertStakeParams.amount, {
      from: accounts[0],
    });
    await baseToken.transfer(gateway.address, bountyAmount.muln(2.5), {
      from: accounts[0],
    });

    await gateway.setStorageRoot(
      revertStakeParams.blockHeight,
      revertStakeParams.storageRoot,
    );

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Merkle proof verification failed.',
    );
  });

  it('should pass when message status of inbox at target is revoked', async () => {
    await gateway.setStorageRoot(
      revertStakeParams.blockHeight,
      revertStakeParams.storageRoot,
    );

    const result = await gateway.progressRevertStake.call(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    assert.strictEqual(
      result.staker_,
      revertStakeParams.staker,
      `Staker address must be equal to ${revertStakeParams.staker}.`,
    );

    assert.strictEqual(
      result.amount_.eq(revertStakeParams.amount),
      true,
      `Stake amount ${result.amount_.toString(
        10,
      )} must be equal to ${revertStakeParams.amount.toString(10)}.`,
    );

    assert.strictEqual(
      result.stakerNonce_.eq(revertStakeParams.nonce),
      true,
      `Staker nonce ${result.stakerNonce_.toString(
        10,
      )} must be equal to ${revertStakeParams.nonce.toString(10)}.`,
    );

    const tx = await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    assert.equal(tx.receipt.status, 1, 'Receipt status is unsuccessful');
  });

  it('should emit `StakeReverted` event', async () => {
    await gateway.setStorageRoot(
      revertStakeParams.blockHeight,
      revertStakeParams.storageRoot,
    );

    const tx = await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    const event = EventDecoder.getEvents(tx, gateway);
    const eventData = event.StakeReverted;

    assert.isDefined(
      event.StakeReverted,
      'Event `StakeReverted` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      revertStakeParams.messageHash,
      `Message hash from the event must be equal to ${
        revertStakeParams.messageHash
      }.`,
    );

    assert.strictEqual(
      eventData._staker,
      revertStakeParams.staker,
      `Staker address from the event must be equal to ${
        revertStakeParams.staker
      }.`,
    );

    assert.strictEqual(
      eventData._stakerNonce.eq(revertStakeParams.nonce),
      true,
      `Staker nonce ${eventData._stakerNonce.toString(
        10,
      )} from the event must be equal to ${revertStakeParams.nonce.toString(
        10,
      )}.`,
    );

    assert.strictEqual(
      eventData._amount.eq(revertStakeParams.amount),
      true,
      `Stake amount ${eventData._amount.toString(
        10,
      )} from the event must be equal to ${revertStakeParams.amount.toString(
        10,
      )}.`,
    );
  });

  it('should burn bounty and penalty amount', async () => {
    const burnerAddress = await gateway.burner.call();

    const gatewayInitialTokenBalance = await baseToken.balanceOf(
      gateway.address,
    );
    const stakerInitialTokenBalance = await baseToken.balanceOf(
      revertStakeParams.staker,
    );
    const burnerInitialTokenBalance = await baseToken.balanceOf(burnerAddress);

    await gateway.setStorageRoot(
      revertStakeParams.blockHeight,
      revertStakeParams.storageRoot,
    );

    await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    const gatewayFinalTokenBalance = await baseToken.balanceOf(
      gateway.address,
    );
    const stakerFinalTokenBalance = await baseToken.balanceOf(
      revertStakeParams.staker,
    );
    const burnerFinalTokenBalance = await baseToken.balanceOf(burnerAddress);

    assert.strictEqual(
      gatewayFinalTokenBalance.eq(
        gatewayInitialTokenBalance.sub(bountyAmount.muln(2.5)),
      ),
      true,
      `Gateway balance ${gatewayFinalTokenBalance.toString(
        10,
      )} must be equal to ${gatewayInitialTokenBalance
        .sub(bountyAmount.muln(2.5))
        .toString(10)}.`,
    );

    assert.strictEqual(
      stakerInitialTokenBalance.eq(stakerFinalTokenBalance),
      true,
      `Staker ${stakerInitialTokenBalance.toString(
        10,
      )} balance must be equal to ${stakerFinalTokenBalance.toString(10)}.`,
    );

    assert.strictEqual(
      burnerFinalTokenBalance.eq(
        burnerInitialTokenBalance.add(bountyAmount.muln(2.5)),
      ),
      true,
      `Burner balance ${burnerFinalTokenBalance.toString(
        10,
      )} must be equal to ${burnerInitialTokenBalance
        .add(bountyAmount.muln(2.5))
        .toString(10)}.`,
    );
  });

  it('should transfer stake amount to staker', async () => {
    const burnerAddress = await gateway.burner.call();

    const gatewayInitialTokenBalance = await mockToken.balanceOf(
      gateway.address,
    );
    const stakerInitialTokenBalance = await mockToken.balanceOf(
      revertStakeParams.staker,
    );
    const burnerInitialTokenBalance = await mockToken.balanceOf(burnerAddress);

    await gateway.setStorageRoot(
      revertStakeParams.blockHeight,
      revertStakeParams.storageRoot,
    );

    await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    const gatewayFinalTokenBalance = await mockToken.balanceOf(
      gateway.address,
    );
    const stakerFinalTokenBalance = await mockToken.balanceOf(
      revertStakeParams.staker,
    );
    const burnerFinalTokenBalance = await mockToken.balanceOf(burnerAddress);

    assert.strictEqual(
      gatewayFinalTokenBalance.eq(
        gatewayInitialTokenBalance.sub(revertStakeParams.amount),
      ),
      true,
      `Gateway balance ${gatewayFinalTokenBalance.toString(
        10,
      )} must be equal to ${gatewayInitialTokenBalance
        .sub(revertStakeParams.amount)
        .toString(10)}.`,
    );

    assert.strictEqual(
      stakerFinalTokenBalance.eq(
        stakerInitialTokenBalance.add(revertStakeParams.amount),
      ),
      true,
      `Staker balance ${stakerFinalTokenBalance.toString(
        10,
      )} must be equal to ${stakerInitialTokenBalance
        .add(revertStakeParams.amount)
        .toString(10)}.`,
    );

    assert.strictEqual(
      burnerFinalTokenBalance.eq(burnerInitialTokenBalance),
      true,
      `Burner balance ${burnerFinalTokenBalance.toString(
        10,
      )} must be equal to ${burnerInitialTokenBalance.toString(10)}.`,
    );
  });
});
