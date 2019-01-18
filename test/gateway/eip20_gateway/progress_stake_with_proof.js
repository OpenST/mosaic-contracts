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

const Gateway = artifacts.require("./TestEIP20Gateway.sol");
const MockOrganization = artifacts.require('MockOrganization.sol');
const MockToken = artifacts.require("MockToken");
const GatewayLib = artifacts.require("GatewayLib");

const BN = require('bn.js');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');
const Utils = require('../../../test/test_lib/utils');
const web3 = require('../../../test/test_lib/web3.js');

const NullAddress = Utils.NULL_ADDRESS;
const ZeroBytes = Utils.ZERO_BYTES32;

const proofData =  require("../../../test/data/stake_progressed_1.json");
const MessageStatusEnum = messageBus.MessageStatusEnum;

contract('EIP20Gateway.progressStakeWithProof()', function (accounts) {

  let gateway, mockToken, baseToken, stakeData, progressStakeParams, bountyAmount;

  let setStorageRoot = async function() {

    let blockNumber = new BN(proofData.co_gateway.confirm_stake_intent.proof_data.block_number);
    let storageRoot = proofData.co_gateway.confirm_stake_intent.proof_data.storageHash;
    await gateway.setStorageRoot(blockNumber, storageRoot);

    blockNumber = new BN(proofData.co_gateway.progress_mint.proof_data.block_number);
    storageRoot = proofData.co_gateway.progress_mint.proof_data.storageHash;
    await gateway.setStorageRoot(blockNumber, storageRoot);

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

    bountyAmount = new BN(proofData.gateway.constructor.bounty);

    gateway = await Gateway.new(
      mockToken.address,
      baseToken.address,
      coreAddress,
      bountyAmount,
      organization.address,
      burner,
    );

    let gatewayLib = await GatewayLib.deployed();

    let stakeParams = proofData.gateway.stake.params;

    stakeData = {
      amount: new BN(stakeParams.amount, 16),
      beneficiary: stakeParams.beneficiary,
      gasPrice: new BN(stakeParams.gasPrice, 16),
      gasLimit: new BN(stakeParams.gasLimit, 16),
      nonce: new BN(stakeParams.nonce, 16),
      hashLock: stakeParams.hashLock,
      messageHash: proofData.gateway.stake.return_value.returned_value.messageHash_,
      staker: stakeParams.staker,
    };

    let stakeIntentHash = await gatewayLib.hashStakeIntent(
      stakeData.amount,
      stakeData.beneficiary,
      proofData.contracts.gateway,
    );

    stakeData.intentHash = stakeIntentHash;

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
      stakeData.hashLock
    );

    await gateway.setOutboxStatus(
      stakeData.messageHash,
      MessageStatusEnum.Declared
    );

    progressStakeParams = {
      messageHash: stakeData.messageHash,
      rlpParentNodes: proofData.co_gateway.confirm_stake_intent.proof_data.storageProof[0].serializedProof,
      blockHeight: new BN(proofData.co_gateway.confirm_stake_intent.proof_data.block_number),
      messageStatus: MessageStatusEnum.Declared,
    };

    await mockToken.transfer(gateway.address, stakeData.amount, { from: accounts[0] });
    await baseToken.transfer(gateway.address, bountyAmount, { from: accounts[0] });

  });

  it('should fail when message hash is zero', async function () {

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

  it('should fail when storage proof is zero', async function () {

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

  it('should fail when storage proof is incorrect', async function () {

    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        proofData.gateway.stake.proof_data.storageProof[0].serializedProof,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Merkle proof verification failed.',
    );

  });

  it('should fail when storage proof is invalid', async function () {

    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        "0x1234",
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'VM Exception while processing transaction: revert',
    );

  });

  it('should fail when storage root is not committed for given block height',
    async function () {

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

  it('should fail for undeclared message', async function () {

    await setStorageRoot();

    await Utils.expectRevert(
      gateway.progressStakeWithProof(
        web3.utils.sha3("dummy"),
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        progressStakeParams.messageStatus,
      ),
      'Status of message on source must be Declared or DeclareRevocation.',
    );

  });

  it('should fail for revoked message', async function () {

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

  it('should fail for already progressed message', async function () {

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

  it('should fail when the message status in source is declared revocation ' +
    'and in the target is declared', async function () {

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

  it('should pass when the message status in source is declared revocation ' +
    'and in the target is progressed', async function () {

    await gateway.setOutboxStatus(
      stakeData.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await setStorageRoot();

    let result = await gateway.progressStakeWithProof.call(
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

    let tx = await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      proofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
      new BN(proofData.co_gateway.progress_mint.proof_data.block_number),
      MessageStatusEnum.Progressed,
    );

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

  });

  it('should pass when the message status at source and target is declared',
    async function () {

      await setStorageRoot();

      let result = await gateway.progressStakeWithProof.call(
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

      let tx = await gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        progressStakeParams.rlpParentNodes,
        progressStakeParams.blockHeight,
        MessageStatusEnum.Declared,
      );

      assert.equal(
        tx.receipt.status,
        1,
        "Receipt status is unsuccessful",
      );

    });

  it('should pass when the message status at source is declared and at target ' +
    'is progressed',
    async function () {

      await setStorageRoot();

      let result = await gateway.progressStakeWithProof.call(
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

      let tx = await gateway.progressStakeWithProof(
        progressStakeParams.messageHash,
        proofData.co_gateway.progress_mint.proof_data.storageProof[0].serializedProof,
        new BN(proofData.co_gateway.progress_mint.proof_data.block_number),
        MessageStatusEnum.Progressed,
      );

      assert.equal(
        tx.receipt.status,
        1,
        "Receipt status is unsuccessful",
      );

    });

  it('should emit StakeProgressed event', async function () {

    await setStorageRoot();

    let tx = await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      progressStakeParams.rlpParentNodes,
      progressStakeParams.blockHeight,
      MessageStatusEnum.Declared,
    );

    let event = EventDecoder.getEvents(tx, gateway);
    let eventData = event.StakeProgressed;

    assert.isDefined(
      event.StakeProgressed,
      'Event `StakeProgressed` must be emitted.',
    );
    assert.strictEqual(
      eventData._messageHash,
      progressStakeParams.messageHash,
      `Message hash from the event must be equalt to ${progressStakeParams.messageHash}.`,
    );
    assert.strictEqual(
      eventData._staker,
      stakeData.staker,
      `Staker address from the event must be equal to ${stakeData.staker}.`,
    );
    assert.strictEqual(
      eventData._stakerNonce.eq(stakeData.nonce),
      true,
      `Staker nonce from the event must be equal to ${stakeData.nonce}.`,
    );
    assert.strictEqual(
      eventData._amount.eq(stakeData.amount),
      true,
      `Stake amount from event must be equal to ${stakeData.amount}.`,
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


  it('should have correct balances', async function () {

    let stakeVault = await gateway.stakeVault.call();
    let caller = accounts[0];

    let callerInitialBaseTokenBalance = await baseToken.balanceOf(caller);
    let gatewayInitialTokenBalance = await mockToken.balanceOf(gateway.address);
    let gatewayInitialBaseTokenBalance = await baseToken.balanceOf(gateway.address);
    let stakeVaultInitialTokenBalance = await mockToken.balanceOf(stakeVault);

    await setStorageRoot();

    await gateway.progressStakeWithProof(
      progressStakeParams.messageHash,
      progressStakeParams.rlpParentNodes,
      progressStakeParams.blockHeight,
      MessageStatusEnum.Declared,
    );

    let callerFinalBaseTokenBalance = await baseToken.balanceOf(caller);
    let gatewayFinalTokenBalance = await mockToken.balanceOf(gateway.address);
    let gatewayFinalBaseTokenBalance = await baseToken.balanceOf(gateway.address);
    let stakeVaultFinalTokenBalance = await mockToken.balanceOf(stakeVault);

    assert.strictEqual(
      callerFinalBaseTokenBalance.eq(callerInitialBaseTokenBalance.add(bountyAmount)),
      true,
      "Bounty should be returned to caller.",
    );

    assert.strictEqual(
      gatewayFinalTokenBalance.eq(gatewayInitialTokenBalance.sub(stakeData.amount)),
      true,
      "Gateway token balance should reduced by stake amount on successful " +
      "progress stake.",
    );

    assert.strictEqual(
      gatewayFinalBaseTokenBalance.eq(gatewayInitialBaseTokenBalance.sub(bountyAmount)),
      true,
      "Gateway base balance should reduced by bounty amount on successful " +
      "progress stake.",
    );

    assert.strictEqual(
      stakeVaultFinalTokenBalance.eq(stakeVaultInitialTokenBalance.add(stakeData.amount)),
      true,
      "Stake vault token balance should increase by stake amount on " +
      "successful progress stake.",
    );

  });

});
