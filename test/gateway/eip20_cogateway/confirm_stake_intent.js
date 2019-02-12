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

const CoGateway = artifacts.require('TestEIP20CoGateway');
const Token = artifacts.require('MockUtilityToken');
const BN = require('bn.js');
const Utils = require('./../../test_lib/utils');
const TestData = require('./test_data/confirm_stake_intent.json');
const EventDecoder = require('../../test_lib/event_decoder.js');
const messageBus = require('../../test_lib/message_bus.js');

const NullAddress = Utils.NULL_ADDRESS;
const { MessageStatusEnum } = messageBus;

contract('EIP20CoGateway.confirmStakeIntent() ', (accounts) => {
  // Contract deployment related variables.
  let valueTokenAddress;
  let utilityToken;
  let bountyAmount;
  let coreAddress;
  let organizationAddress;
  let coGateway;
  let gatewayAddress;
  let burnerAddress;

  // Confirm stake intent related variables.
  let staker;
  let stakerNonce;
  let beneficiary;
  let amount;
  let gasPrice;
  let gasLimit;
  let hashLock;
  let blockHeight;
  let rlpParentNodes;
  let storageRoot;
  let data;

  // Function to initialize test data.
  function initializeData(testData) {
    data = testData;

    // Populate the deployment params.
    valueTokenAddress = data.token;
    bountyAmount = new BN(data.bountyAmount);
    gatewayAddress = data.gateway;

    // Populate the confirm stake params.
    staker = data.staker;
    stakerNonce = new BN(data.nonce);
    beneficiary = data.beneficiary;
    amount = new BN(data.stakeAmount);
    gasPrice = new BN(data.gasPrice);
    gasLimit = new BN(data.gasLimit);
    blockHeight = new BN(data.blockNumber);
    rlpParentNodes = data.proofData.parentNodes;
    storageRoot = data.proofData.storageHash;
    hashLock = data.hashLock;
  }

  // Common assertion code for confirm stake intent.
  async function assertConfirmStakeIntent() {
    const result = await coGateway.confirmStakeIntent.call(
      staker,
      stakerNonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
    );

    assert.strictEqual(
      result,
      data.messageHash,
      `Message hash form the contract must match ${data.messageHash}.`,
    );

    await coGateway.confirmStakeIntent(
      staker,
      stakerNonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
    );

    const mintData = await coGateway.mints(data.messageHash);

    assert.strictEqual(
      amount.eq(mintData.amount),
      true,
      `Mints.amount from the contract must match ${amount.toString(10)}.`,
    );

    assert.strictEqual(
      mintData.beneficiary,
      beneficiary,
      `Mints.beneficiary from the contract must match ${beneficiary}.`,
    );

    const messageData = await coGateway.messages(data.messageHash);

    assert.strictEqual(
      messageData.intentHash,
      data.intentHash,
      `Message.intentHash from the contract must be equal to ${
        data.intentHash
      }.`,
    );

    assert.strictEqual(
      stakerNonce.eq(messageData.nonce),
      true,
      `Message.nonce from the contract must be equal to ${stakerNonce.toString(10)}.`,
    );

    assert.strictEqual(
      gasPrice.eq(messageData.gasPrice),
      true,
      `Message.gasPrice from the contract must be equal to ${gasPrice.toString(10)}.`,
    );

    assert.strictEqual(
      gasLimit.eq(messageData.gasLimit),
      true,
      `Message.gasLimit from the contract must be equal to ${gasLimit.toString(10)}.`,
    );

    assert.strictEqual(
      messageData.sender,
      staker,
      `Message.sender from the contract must be equal to ${staker}.`,
    );

    assert.strictEqual(
      messageData.hashLock,
      hashLock,
      `Message.hashLock from the contract must be equal to ${hashLock}.`,
    );
  }

  beforeEach(async () => {
    initializeData(TestData[0]);
    let sender;

    [sender, coreAddress, organizationAddress, burnerAddress] = accounts;

    // Deploy mocked utility token.
    utilityToken = await Token.new(
      data.token,
      '',
      '',
      18,
      organizationAddress,
      { from: sender },
    );


    // Deploy CoGateway.
    coGateway = await CoGateway.new(
      valueTokenAddress,
      utilityToken.address,
      coreAddress,
      bountyAmount,
      organizationAddress,
      gatewayAddress,
      burnerAddress,
    );

    // Set CoGateway address in mocked utility token.
    await utilityToken.setCoGatewayAddress(coGateway.address);

    // Set the storage root.
    await coGateway.setStorageRoot(blockHeight, storageRoot);
  });

  it('should fail when staker address is zero.', async () => {
    staker = NullAddress;

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'Staker address must not be zero.',
    );
  });

  it('should fail when beneficiary address is zero.', async () => {
    beneficiary = NullAddress;

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'Beneficiary address must not be zero.',
    );
  });

  it('should fail when stake amount is zero.', async () => {
    amount = new BN(0);

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'Stake amount must not be zero.',
    );
  });

  it('should fail when rlp parent node is zero.', async () => {
    rlpParentNodes = '0x';

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'RLP parent nodes must not be zero.',
    );
  });

  it('should fail when staker nonce is already consumed.', async () => {
    stakerNonce = new BN(0);

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'Invalid nonce.',
    );
  });

  it('should fail when storage root for the block height is not available.', async () => {
    blockHeight = new BN(1);

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'Storage root must not be zero.',
    );
  });

  it('should fail when the rlp parent node is a incorrect proof data.', async () => {
    rlpParentNodes = '0xf9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'Merkle proof verification failed.',
    );
  });

  it('should fail to confirm stake intent if its already confirmed once', async () => {
    await coGateway.confirmStakeIntent(
      staker,
      stakerNonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
    );

    await Utils.expectRevert(
      coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      ),
      'Invalid nonce.',
    );
  });

  it(
    'should fail to confirm new stake intent if status of previous '
    + 'confirmed stake intent is declared',
    async () => {
      await coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      );

      initializeData(TestData[1]);

      await coGateway.setStorageRoot(blockHeight, storageRoot);

      await Utils.expectRevert(
        coGateway.confirmStakeIntent(
          staker,
          stakerNonce,
          beneficiary,
          amount,
          gasPrice,
          gasLimit,
          hashLock,
          blockHeight,
          rlpParentNodes,
        ),
        'Previous process is not completed.',
      );
    },
  );

  it('should pass with valid params.', async () => {
    await assertConfirmStakeIntent();
  });

  it('should emit `StakeIntentConfirmed` event.', async () => {
    const tx = await coGateway.confirmStakeIntent(
      staker,
      stakerNonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      rlpParentNodes,
    );

    const event = EventDecoder.getEvents(tx, coGateway);

    assert.isDefined(
      event.StakeIntentConfirmed,
      'Event StakeIntentConfirmed must be emitted.',
    );

    const eventData = event.StakeIntentConfirmed;

    assert.strictEqual(
      eventData._messageHash,
      data.messageHash,
      `Message hash from event must be equal to ${data.messageHash}.`,
    );

    assert.strictEqual(
      eventData._staker,
      staker,
      `Staker address from event must be equal to ${staker}.`,
    );

    assert.strictEqual(
      stakerNonce.eq(eventData._stakerNonce),
      true,
      `Staker nonce from event must be equal to ${stakerNonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      beneficiary,
      `Beneficiary address from event must be equal to ${beneficiary}.`,
    );

    assert.strictEqual(
      amount.eq(eventData._amount),
      true,
      `Amount from event must be equal to ${amount.toString(10)}.`,
    );

    assert.strictEqual(
      blockHeight.eq(eventData._blockHeight),
      true,
      `Block height from event must be equal to ${blockHeight.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._hashLock,
      hashLock,
      `Hash lock from event must be equal to ${hashLock}.`,
    );
  });

  it(
    'should confirm new stake intent if status of previous '
    + 'confirmed stake intent is revoked',
    async () => {
      await coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      );

      await coGateway.setInboxStatus(
        data.messageHash,
        MessageStatusEnum.Revoked,
      );

      initializeData(TestData[1]);

      await coGateway.setStorageRoot(blockHeight, storageRoot);

      await assertConfirmStakeIntent();
    },
  );

  it(
    'should confirm new stake intent if status of previous '
    + 'confirmed stake intent is progressed',
    async () => {
      await coGateway.confirmStakeIntent(
        staker,
        stakerNonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        rlpParentNodes,
      );

      await coGateway.setInboxStatus(
        data.messageHash,
        MessageStatusEnum.Progressed,
      );

      initializeData(TestData[1]);

      await coGateway.setStorageRoot(blockHeight, storageRoot);

      await assertConfirmStakeIntent();
    },
  );
});
