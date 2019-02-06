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
const TestDataJSON = require('./test_data/redeem_progressed_1');
const TestDataJSON2 = require('./test_data/redeem_progressed_2');
const messageBus = require('../../test_lib/message_bus.js');
const EventDecoder = require('../../test_lib/event_decoder.js');

const EIP20Gateway = artifacts.require('TestEIP20Gateway.sol');
const MockOrganization = artifacts.require('MockOrganization.sol');

const { MessageStatusEnum } = messageBus;

contract('EIP20Gateway.confirmRedeemIntent()', (accounts) => {
  let bountyAmount;
  let owner;
  let burnerAddress;
  let dummyStateRootProvider;
  let eip20Gateway;
  let mockOrganization;
  let worker;

  const redeemRequest = {};
  const redeemRequestWithNonceTwo = {};

  async function confirmRedeemIntent(stubData) {
    await eip20Gateway.confirmRedeemIntent(
      stubData.redeemer,
      stubData.nonce,
      stubData.beneficiary,
      stubData.amount,
      stubData.gasPrice,
      stubData.gasLimit,
      stubData.blockNumber,
      stubData.hashLock,
      stubData.storageProof,
    );
  }

  beforeEach(async () => {
    let requestData = TestDataJSON.gateway.confirm_redeem_intent.params;
    redeemRequest.nonce = new BN(requestData.nonce, 16);
    redeemRequest.amount = new BN(requestData.amount, 16);
    redeemRequest.gasLimit = new BN(requestData.gasLimit, 16);
    redeemRequest.blockNumber = new BN(requestData.blockNumber, 16);
    redeemRequest.gasPrice = new BN(requestData.gasPrice, 16);
    redeemRequest.messageHash = TestDataJSON
      .gateway
      .confirm_redeem_intent
      .return_value
      .returned_value
      .messageHash_;
    redeemRequest.storageProof = requestData.storageProof;
    redeemRequest.redeemer = requestData.redeemer;
    redeemRequest.beneficiary = requestData.beneficiary;
    redeemRequest.hashLock = requestData.hashLock;
    redeemRequest.storageRoot = requestData.storageRoot;

    requestData = TestDataJSON2.gateway.confirm_redeem_intent.params;
    redeemRequestWithNonceTwo.nonce = new BN(requestData.nonce, 16);
    redeemRequestWithNonceTwo.amount = new BN(requestData.amount, 16);
    redeemRequestWithNonceTwo.gasLimit = new BN(requestData.gasLimit, 16);
    redeemRequestWithNonceTwo.blockNumber = new BN(requestData.blockNumber, 16);
    redeemRequestWithNonceTwo.gasPrice = new BN(requestData.gasPrice, 16);
    redeemRequestWithNonceTwo.storageProof = requestData.storageProof;
    redeemRequestWithNonceTwo.redeemer = requestData.redeemer;
    redeemRequestWithNonceTwo.beneficiary = requestData.beneficiary;
    redeemRequestWithNonceTwo.hashLock = requestData.hashLock;
    redeemRequestWithNonceTwo.storageRoot = requestData.storageRoot;

    [dummyStateRootProvider, owner, burnerAddress, worker] = accounts;

    mockOrganization = await MockOrganization.new(owner, worker);

    bountyAmount = new BN(100);

    const dummyToken = accounts[5];
    const dummyBaseToken = accounts[2];

    eip20Gateway = await EIP20Gateway.new(
      dummyToken,
      dummyBaseToken,
      dummyStateRootProvider,
      bountyAmount,
      mockOrganization.address,
      burnerAddress,
    );

    await eip20Gateway.activateGateway(TestDataJSON.contracts.coGateway, { from: owner });
    await eip20Gateway.setStorageRoot(
      redeemRequest.blockNumber,
      redeemRequest.storageRoot,
    );
  });

  it('should pass when all the params are valid', async () => {
    await confirmRedeemIntent(redeemRequest);
  });

  it('should return correct param', async () => {
    const result = await eip20Gateway.confirmRedeemIntent.call(
      redeemRequest.redeemer,
      redeemRequest.nonce,
      redeemRequest.beneficiary,
      redeemRequest.amount,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.blockNumber,
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    assert.strictEqual(
      result,
      redeemRequest.messageHash,
      `Message hash from event must be equal to ${redeemRequest.messageHash}.`,
    );
  });

  it('should emit `RedeemIntentConfirmed` event.', async () => {
    const tx = await eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      redeemRequest.nonce,
      redeemRequest.beneficiary,
      redeemRequest.amount,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.blockNumber,
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    const event = EventDecoder.getEvents(tx, eip20Gateway);

    assert.isDefined(
      event.RedeemIntentConfirmed,
      'Event RedeemIntentConfirmed must be emitted.',
    );

    const eventData = event.RedeemIntentConfirmed;

    assert.strictEqual(
      eventData._messageHash,
      redeemRequest.messageHash,
      `Message hash from event must be equal to ${redeemRequest.messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      redeemRequest.redeemer,
      `Redeemer address must be equal to ${redeemRequest.redeemer}.`,
    );

    assert.strictEqual(
      redeemRequest.nonce.eq(eventData._redeemerNonce),
      true,
      `Nonce value ${eventData._redeemerNonce.toString(10)} from event must be equal to ${redeemRequest.nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      redeemRequest.beneficiary,
      `Beneficiary address from event must be equal to ${redeemRequest.beneficiary}.`,
    );

    assert.strictEqual(
      redeemRequest.amount.eq(eventData._amount),
      true,
      `Amount ${eventData._amount.toString(10)} from event must be equal to ${redeemRequest.amount.toString(10)}.`,
    );

    assert.strictEqual(
      redeemRequest.blockNumber.eq(eventData._blockHeight),
      true,
      `Block height ${eventData._blockHeight.toString(10)} from event must be equal to ${redeemRequest.blockNumber.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._hashLock,
      redeemRequest.hashLock,
      `Hash lock from event must be equal to ${redeemRequest.hashLock}.`,
    );
  });

  it('should confirm new redeem intent if status of previous '
    + 'confirmed redeem message is revoked', async () => {
    await eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      redeemRequest.nonce,
      redeemRequest.beneficiary,
      redeemRequest.amount,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.blockNumber,
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    await eip20Gateway.setInboxStatus(
      redeemRequest.messageHash,
      MessageStatusEnum.Revoked,
    );

    await eip20Gateway.setStorageRoot(
      redeemRequestWithNonceTwo.blockNumber,
      redeemRequestWithNonceTwo.storageRoot,
    );

    await confirmRedeemIntent(redeemRequestWithNonceTwo);
  });

  it('should confirm new redeem intent if status of previous '
    + 'confirmed redeem intent is progressed', async () => {
    await eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      redeemRequest.nonce,
      redeemRequest.beneficiary,
      redeemRequest.amount,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.blockNumber,
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    await eip20Gateway.setInboxStatus(
      redeemRequest.messageHash,
      MessageStatusEnum.Progressed,
    );

    await eip20Gateway.setStorageRoot(
      redeemRequestWithNonceTwo.blockNumber,
      redeemRequestWithNonceTwo.storageRoot,
    );

    await confirmRedeemIntent(redeemRequestWithNonceTwo);
  });

  it('should fail when redeemer address is zero', async () => {
    await Utils.expectRevert(
      eip20Gateway.confirmRedeemIntent(
        Utils.NULL_ADDRESS,
        redeemRequest.nonce,
        redeemRequest.beneficiary,
        redeemRequest.amount,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      ),
      'Redeemer address must not be zero.',
    );
  });

  it('should fail when beneficiary address is zero', async () => {
    await Utils.expectRevert(
      eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        redeemRequest.nonce,
        Utils.NULL_ADDRESS,
        redeemRequest.amount,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      ),
      'Beneficiary address must not be zero.',
    );
  });

  it('should fail when amount is zero', async () => {
    const amount = new BN(0);
    await Utils.expectRevert(
      eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        redeemRequest.nonce,
        redeemRequest.beneficiary,
        amount,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      ),
      'Redeem amount must not be zero.',
    );
  });

  it('should fail when rlp of parent nodes is zero', async () => {
    const rlpParentNodes = '0x';
    await Utils.expectRevert(
      eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        redeemRequest.nonce,
        redeemRequest.beneficiary,
        redeemRequest.amount,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        rlpParentNodes,
      ),
      'RLP encoded parent nodes must not be zero.',
    );
  });

  it('should fail when redeemer nonce is already consumed', async () => {
    const redeemerNonce = new BN(0);
    await Utils.expectRevert(
      eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        redeemerNonce,
        redeemRequest.beneficiary,
        redeemRequest.amount,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      ),
      'Invalid nonce.',
    );
  });

  it('should fail when storage root for the block height is not available',
    async () => {
      const blockHeight = new BN(1);
      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemRequest.redeemer,
          redeemRequest.nonce,
          redeemRequest.beneficiary,
          redeemRequest.amount,
          redeemRequest.gasPrice,
          redeemRequest.gasLimit,
          blockHeight,
          redeemRequest.hashLock,
          redeemRequest.storageProof,
        ),
        'Storage root must not be zero.',
      );
    });

  it('should fail when the rlp parent nodes is incorrect',
    async () => {
      const rlpParentNodes = TestDataJSON2.gateway.confirm_redeem_intent.params.storageProof;

      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemRequest.redeemer,
          redeemRequest.nonce,
          redeemRequest.beneficiary,
          redeemRequest.amount,
          redeemRequest.gasPrice,
          redeemRequest.gasLimit,
          redeemRequest.blockNumber,
          redeemRequest.hashLock,
          rlpParentNodes,
        ),
        'Merkle proof verification failed.',
      );
    });

  it('should fail to confirm redeem intent if its already confirmed once',
    async () => {
      await eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        redeemRequest.nonce,
        redeemRequest.beneficiary,
        redeemRequest.amount,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      );

      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemRequest.redeemer,
          redeemRequest.nonce,
          redeemRequest.beneficiary,
          redeemRequest.amount,
          redeemRequest.gasPrice,
          redeemRequest.gasLimit,
          redeemRequest.blockNumber,
          redeemRequest.hashLock,
          redeemRequest.storageProof,
        ),
        'Invalid nonce.',
      );
    });

  it('should fail to confirm new redeem intent if status of previous '
    + 'confirmed redeem intent is declared', async () => {
    await eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      redeemRequest.nonce,
      redeemRequest.beneficiary,
      redeemRequest.amount,
      redeemRequest.gasPrice,
      redeemRequest.gasLimit,
      redeemRequest.blockNumber,
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    await Utils.expectRevert(
      eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        redeemRequest.nonce.addn(1),
        redeemRequest.beneficiary,
        redeemRequest.amount,
        redeemRequest.gasPrice,
        redeemRequest.gasLimit,
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      ),
      'Previous process is not completed.',
    );
  });
});
