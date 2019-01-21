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

const Gateway = artifacts.require("./TestEIP20Gateway.sol");
const MockOrganization = artifacts.require('MockOrganization.sol');
const MockToken = artifacts.require("MockToken");
const GatewayLib = artifacts.require("GatewayLib");

const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');
const GatewayUtils = require('./helpers/gateway_utils');

const revokedProofData =  require("../../../test/data/stake_revoked_1.json");
const progressedProofData =  require("../../../test/data/stake_progressed_1.json");

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;
const MessageStatusEnum = messageBus.MessageStatusEnum;

contract('EIP20Gateway.progressRevertStake()', function (accounts) {

  let gateway, mockToken, baseToken, revertStakeParams, bountyAmount, gatewayLib;

  let gatewayUtils = new GatewayUtils();

  let setup = async function(revertStakeParams){

    let stakeIntentHash = await gatewayUtils.hashStakeIntent(
      revertStakeParams.amount,
      revertStakeParams.beneficiary,
      revertStakeParams.gatewayAddress,
    );

    revertStakeParams.intentHash = stakeIntentHash;

    await gateway.setStake(
      revertStakeParams.messageHash,
      revertStakeParams.beneficiary,
      revertStakeParams.amount,
    );

    await gateway.setMessage(
      revertStakeParams.intentHash,
      revertStakeParams.nonce,
      revertStakeParams.gasPrice,
      revertStakeParams.gasLimit,
      revertStakeParams.staker,
      revertStakeParams.hashLock
    );

    await gateway.setOutboxStatus(
      revertStakeParams.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

  };

  beforeEach(async function () {
    mockToken = await MockToken.new({ from: accounts[0] });
    baseToken = await MockToken.new({ from: accounts[0] });

    let owner = accounts[2];
    let worker = accounts[7];
    let organization = await MockOrganization.new(
      owner,
      worker,
      { from: accounts[0] },
    );

    let coreAddress = accounts[5];
    let burner = NullAddress;

    bountyAmount = new BN(revokedProofData.gateway.constructor.bounty);

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      organization.address,
      burner,
    );

    gatewayLib = await GatewayLib.deployed();

    let paramsData = revokedProofData.gateway.stake.params;

    revertStakeParams = {
      amount: new BN(paramsData.amount, 16),
      beneficiary: paramsData.beneficiary,
      gasPrice: new BN(paramsData.gasPrice, 16),
      gasLimit: new BN(paramsData.gasLimit, 16),
      nonce: new BN(paramsData.nonce, 16),
      hashLock: paramsData.hashLock,
      messageHash: revokedProofData.gateway.stake.return_value.returned_value.messageHash_,
      staker: paramsData.staker,
      rlpParentNodes: revokedProofData.co_gateway.confirm_revert_stake_intent.proof_data.storageProof[0].serializedProof,
      blockHeight: new BN(revokedProofData.co_gateway.confirm_revert_stake_intent.proof_data.block_number,16),
      gatewayAddress: revokedProofData.contracts.gateway,
      storageRoot: revokedProofData.co_gateway.confirm_revert_stake_intent.proof_data.storageHash,
    };

    await setup(revertStakeParams);

    await mockToken.transfer(gateway.address, revertStakeParams.amount, { from: accounts[0] });

    /*
     * Gateway should have bounty amount when stake was done and penalty amount
     * when revert stake was requested. So transfer bounty + penalty amount to
     * gateway for testing. penalty is 1.5 of bounty so total amount to
     * transfer is 2.5 the bounty amount.
     */
    await baseToken.transfer(gateway.address, bountyAmount.muln(2.5), { from: accounts[0] });
  });

  it('should fail when message hash is zero', async function () {

    await Utils.expectRevert(
      gateway.progressRevertStake(
        ZeroBytes,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Message hash must not be zero.',
    );

  });

  it('should fail when storage proof zero', async function () {

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        '0x',
      ),
      'RLP parent nodes must not be zero.',
    );
  });

  it('should fail when storage proof is incorrect', async function () {

    let blockHeight = new BN(revokedProofData.co_gateway.confirm_stake_intent.proof_data.block_number,16);
    let storageRoot = revokedProofData.co_gateway.confirm_stake_intent.proof_data.storageHash;

    await gateway.setStorageRoot(blockHeight, storageRoot);

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        blockHeight,
        revokedProofData.co_gateway.confirm_stake_intent.proof_data.storageProof[0].serializedProof,
      ),
      'Merkle proof verification failed.',
    );

  });

  it('should fail when storage proof is invalid', async function () {

    await gateway.setStorageRoot(revertStakeParams.blockHeight, revertStakeParams.storageRoot);

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        "0x1245",
      ),
      'VM Exception while processing transaction: revert',
    );

  });

  it('should fail when storage root is not committed for given block height', async function () {

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Storage root must not be zero.',
    );

  });

  it('should fail when message is undeclared', async function () {

    await Utils.expectRevert(
      gateway.progressRevertStake(
        web3.utils.sha3("dummy"),
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'StakeIntentHash must not be zero.',
    );

  });

  it('should fail when message is progressed', async function () {

    await gateway.setOutboxStatus(
      revertStakeParams.messageHash,
      MessageStatusEnum.Progressed,
    );

    await gateway.setStorageRoot(revertStakeParams.blockHeight, revertStakeParams.storageRoot);

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Message on source must be DeclaredRevocation.',
    );

  });

  it('should fail when message status of inbox at target is progressed', async function () {

    let paramsData = progressedProofData.gateway.stake.params;

    revertStakeParams = {
      amount: new BN(paramsData.amount, 16),
      beneficiary: paramsData.beneficiary,
      gasPrice: new BN(paramsData.gasPrice, 16),
      gasLimit: new BN(paramsData.gasLimit, 16),
      nonce: new BN(paramsData.nonce, 16),
      hashLock: paramsData.hashLock,
      messageHash: progressedProofData.gateway.stake.return_value.returned_value.messageHash_,
      staker: paramsData.staker,
      rlpParentNodes: progressedProofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
      blockHeight: new BN(progressedProofData.co_gateway.progress_mint.proof_data.block_number,16),
      gatewayAddress: progressedProofData.contracts.gateway,
      storageRoot: progressedProofData.co_gateway.progress_mint.proof_data.storageHash,
    };

    await setup(revertStakeParams);

    await mockToken.transfer(gateway.address, revertStakeParams.amount, { from: accounts[0] });
    await baseToken.transfer(gateway.address, bountyAmount.muln(2.5), { from: accounts[0] });

    await gateway.setStorageRoot(revertStakeParams.blockHeight, revertStakeParams.storageRoot);

    await Utils.expectRevert(
      gateway.progressRevertStake(
        revertStakeParams.messageHash,
        revertStakeParams.blockHeight,
        revertStakeParams.rlpParentNodes,
      ),
      'Merkle proof verification failed.',
    );

  });
  
  it('should pass when message status of inbox at target is revoked', async function () {

    await gateway.setStorageRoot(revertStakeParams.blockHeight, revertStakeParams.storageRoot);

    let result = await gateway.progressRevertStake.call(
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
      `Stake amount ${result.amount_.toString(10)} must be equal to ${revertStakeParams.amount.toString(10)}.`,
    );

    assert.strictEqual(
      result.stakerNonce_.eq(revertStakeParams.nonce),
      true,
      `Staker nonce ${result.stakerNonce_.toString(10)} must be equal to ${revertStakeParams.nonce.toString(10)}.`,
    );

    let tx = await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

  });

  it('should emit `StakeReverted` event ', async function () {

    await gateway.setStorageRoot(revertStakeParams.blockHeight, revertStakeParams.storageRoot);

    let tx = await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    let event = EventDecoder.getEvents(tx, gateway);
    let eventData = event.StakeReverted;

    assert.isDefined(
      event.StakeReverted,
      'Event `StakeReverted` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      revertStakeParams.messageHash,
      `Message hash from the event must be equal to ${revertStakeParams.messageHash}.`,
    );

    assert.strictEqual(
      eventData._staker,
      revertStakeParams.staker,
      `Staker address from the event must be equal to ${revertStakeParams.staker}.`,
    );

    assert.strictEqual(
      eventData._stakerNonce.eq(revertStakeParams.nonce),
      true,
      `Staker nonce ${eventData._stakerNonce.toString(10)} from the event must be equal to ${revertStakeParams.nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._amount.eq(revertStakeParams.amount),
      true,
      `Stake amount ${eventData._amount.toString(10)} from the event must be equal to ${revertStakeParams.amount.toString(10)}.`,
    );

  });

  it('should burn bounty and penalty amount ', async function () {

    let burnerAddress = await gateway.burner.call();

    let gatewayInitialTokenBalance = await baseToken.balanceOf(gateway.address);
    let stakerInitialTokenBalance = await baseToken.balanceOf(revertStakeParams.staker);
    let burnerInitialTokenBalance = await baseToken.balanceOf(burnerAddress);

    await gateway.setStorageRoot(revertStakeParams.blockHeight, revertStakeParams.storageRoot);

    await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    let gatewayFinalTokenBalance = await baseToken.balanceOf(gateway.address);
    let stakerFinalTokenBalance = await baseToken.balanceOf(revertStakeParams.staker);
    let burnerFinalTokenBalance = await baseToken.balanceOf(burnerAddress);

    assert.strictEqual(
      gatewayFinalTokenBalance.eq(gatewayInitialTokenBalance.sub(bountyAmount.muln(2.5))),
      true,
      `Gateway balance ${gatewayFinalTokenBalance.toString(10)} must be equal to ${bountyAmount.muln(2.5).toString(10)}.`,
    );

    assert.strictEqual(
      stakerInitialTokenBalance.eq(stakerFinalTokenBalance),
      true,
      `Staker ${stakerInitialTokenBalance.toString(10)} balance must be equal to ${stakerFinalTokenBalance.toString(10)}.`,
    );

    assert.strictEqual(
      burnerFinalTokenBalance.eq(burnerInitialTokenBalance.add(bountyAmount.muln(2.5))),
      true,
      `Burner balance ${burnerFinalTokenBalance.toString(10)} must be equal to ${bountyAmount.muln(2.5).toString(10)}.`,
    );

  });

  it('should transfer stake amount to staker ', async function () {

    let burnerAddress = await gateway.burner.call();

    let gatewayInitialTokenBalance = await mockToken.balanceOf(gateway.address);
    let stakerInitialTokenBalance = await mockToken.balanceOf(revertStakeParams.staker);
    let burnerInitialTokenBalance = await mockToken.balanceOf(burnerAddress);

    await gateway.setStorageRoot(revertStakeParams.blockHeight, revertStakeParams.storageRoot);

    await gateway.progressRevertStake(
      revertStakeParams.messageHash,
      revertStakeParams.blockHeight,
      revertStakeParams.rlpParentNodes,
    );

    let gatewayFinalTokenBalance = await mockToken.balanceOf(gateway.address);
    let stakerFinalTokenBalance = await mockToken.balanceOf(revertStakeParams.staker);
    let burnerFinalTokenBalance = await mockToken.balanceOf(burnerAddress);

    assert.strictEqual(
      gatewayFinalTokenBalance.eq(gatewayInitialTokenBalance.sub(revertStakeParams.amount)),
      true,
      `Gateway balance ${gatewayFinalTokenBalance.toString(10)} must be equal to ${revertStakeParams.amount.toString(10)}.`,
    );

    assert.strictEqual(
      stakerFinalTokenBalance.eq(stakerInitialTokenBalance.add(revertStakeParams.amount)),
      true,
      `Staker balance ${stakerFinalTokenBalance.toString(10)} must be equal to ${revertStakeParams.amount.toString(10)}.`,
    );

    assert.strictEqual(
      burnerFinalTokenBalance.eq(burnerInitialTokenBalance),
      true,
      `Burner balance ${burnerFinalTokenBalance.toString(10)} must be equal to ${burnerInitialTokenBalance.toString(10)}.`,
    );

  });

});
