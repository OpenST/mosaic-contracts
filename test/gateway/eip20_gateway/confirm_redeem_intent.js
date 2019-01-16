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

const EIP20Gateway = artifacts.require('TestEIP20Gateway.sol'),
  Token = artifacts.require("MockUtilityToken"),
  Utils = require('../../test_lib/utils'),
  MockToken = artifacts.require("MockToken"),
  BN = require('bn.js'),
  TestDataJSON = require('./test_data/redeem_progressed_1'),
  TestDataJSON2 = require('./test_data/redeem_progressed_2'),
  messageBus = require('../../test_lib/message_bus.js'),
  MockOrganization = artifacts.require('MockOrganization.sol'),
  EventDecoder = require('../../test_lib/event_decoder.js'),
  GatewayUtils = require('./helpers/gateway_utils.js');

let MessageStatusEnum = messageBus.MessageStatusEnum;

contract('EIP20Gateway.confirmRedeemIntent() ', function (accounts) {

  let utilityToken,
    bountyAmount,
    coreAddress,
    owner,
    gatewayAddress,
    burnerAddress,
    dummyStateRootProvider,
    eip20Gateway,
    mockToken,
    baseToken,
    testData,
    mockOrganization,
    worker,
    redeemRequest,
    gatewayUtils;

  async function confirmRedeemIntent(stubData) {

    redeemRequest = stubData.gateway.confirm_redeem_intent.params;

    let result = await eip20Gateway.confirmRedeemIntent.call(
      redeemRequest.redeemer,
      new BN(redeemRequest.nonce, 16),
      redeemRequest.beneficiary,
      new BN(redeemRequest.amount, 16),
      new BN(redeemRequest.gasPrice, 16),
      new BN(redeemRequest.gasLimit, 16),
      new BN(redeemRequest.blockNumber, 16),
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    let messageHash = stubData.gateway.confirm_redeem_intent.return_value.returned_value.messageHash_;

    assert.strictEqual(
      result,
      messageHash,
      `Message hash should be equal to ${messageHash}`,
    );

    let tx = await eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      new BN(redeemRequest.nonce, 16),
      redeemRequest.beneficiary,
      new BN(redeemRequest.amount, 16),
      new BN(redeemRequest.gasPrice, 16),
      new BN(redeemRequest.gasLimit, 16),
      new BN(redeemRequest.blockNumber, 16),
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    assert.strictEqual(
      tx.receipt.status,
      true,
      'Transaction should success.',
    );

  }

  beforeEach(async function () {

      mockToken = await MockToken.new({from: accounts[0]});
      baseToken = await MockToken.new({from: accounts[0]});

      redeemRequest = TestDataJSON.gateway.confirm_redeem_intent.params;
      redeemRequest.nonce = new BN(redeemRequest.nonce, 16);
      redeemRequest.amount = new BN(redeemRequest.amount, 16);
      redeemRequest.gasLimit = new BN(redeemRequest.gasLimit, 16);
      redeemRequest.blockNumber = new BN(redeemRequest.blockNumber, 16);
      redeemRequest.gasPrice = new BN(redeemRequest.gasPrice, 16);

      owner = accounts[4];
      worker = accounts[8];

      mockOrganization = await MockOrganization.new(owner, worker);

      utilityToken = await Token.new(
        accounts[3],
        "",
        "",
        18,
        owner,
        {from: accounts[0]},
      );

      coreAddress = accounts[3];
      burnerAddress = accounts[6];
      bountyAmount = new BN(100);
      gatewayAddress = testData;
      dummyStateRootProvider = accounts[2];

      eip20Gateway = await EIP20Gateway.new(
        mockToken.address,
        baseToken.address,
        dummyStateRootProvider,
        bountyAmount,
        mockOrganization.address,
        burnerAddress,
      );

      gatewayUtils = new GatewayUtils(eip20Gateway, mockToken, baseToken);
      await eip20Gateway.activateGateway(TestDataJSON.contracts.coGateway, {from: owner});
      await eip20Gateway.setStorageRoot(
        redeemRequest.blockNumber,
        redeemRequest.storageRoot,
      );

    }
  );

  it('should pass when all the params are valid', async function () {

      let result = await eip20Gateway.confirmRedeemIntent.call(
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

      let messageHash = TestDataJSON.gateway.confirm_redeem_intent.return_value.returned_value.messageHash_;
      assert.strictEqual(
        result,
        messageHash,
        `Message hash from event must be equal to ${messageHash}.`,
      );

      let tx = await eip20Gateway.confirmRedeemIntent(
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
        tx.receipt.status,
        true,
        'Transaction should success.',
      );

    }
  );

  it('should pass when redeemer address is zero', async function () {

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
        "Redeemer address must not be zero"
      );

    }
  );

  it('should pass when beneficiary address is zero', async function () {

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
        "Beneficiary address must not be zero.",
      );

    }
  );

  it('should pass when amount is zero', async function () {

      let amount = new BN(0);
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
        "Redeem amount must not be zero.",
      );

    }
  );

  it('should pass when rlp of parent nodes is zero', async function () {

    let rlpParentNodes = "0x";
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
      "RLP encoded parent nodes must not be zero.",
    );

  });

  it('should fail when redeemer nonce is already consumed.', async function () {

      let redeemerNonce = new BN(0);
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
        "Invalid nonce.",
      );
    }
  );

  it('should fail when storage root for the block height is not available.',
    async function () {

      let blockHeight = new BN(1);
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
        "Storage root must not be zero.",
      );
    });

  it('should fail when the rlp parent node is a incorrect proof data.',
    async function () {

      let rlpParentNodes = "0xf901aaf9013180a00678c6ffdd48f06abd9e31fb6be2abb7dbcceb1ca9dc942b6e4f7a03cfb4133aa0f3f1b8e4525ee1553d7cf1041cada6e19411d7cfec59a4a98d92c97c6844bff280a00c7a9c73ecdd6aa28e7fef237ebbdf3785e090857bc91cc2398e9c3ed8b12bc38080a0b8f31bfe3ec0ebeeb4ff5f38ca7be942611c0799a56fe55d742630aaa9465556a08b05b46d725768c8ba2c8fb0dd65ad2f49d471c0651add5e30689c3fd5f71f418080a0d04be8555e36b14dff8792944f25727cb14758091f6bfbdba8fa279a1f9159dea0f12076080e30aa1220521f506ef9dcea4ce37b9ef1ae493c25ef2f9f318f49f9a03309ff3958cfcb2687b55254511815f79a10dcb806c14f0a3699f6ec5c61254080a0eff8cffd1895f4b09b18d3f87f0e32dff29770c6b50fa99c0d744c1fef53947580f8518080808080808080a04107c22ed07eb1c27134d4b5afdb9caa60e89c49eb1f9a0e1b0b59742f031e24a02b251156366e27fcc5e8b89b7455cbd0fed4ad1bdb7cd792688993fe36da548280808080808080e2a020382fd80a0d114e4a854ca7a543ae6322aa51600085c01d41683ff42f2c7f7a02";

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
        "Merkle proof verification failed.",
      );

    }
  );

  it('should fail to confirm redeem intent if its already confirmed once',
    async function () {

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
        "Invalid nonce.",
      );
    }
  );

  it('should fail to confirm new redeem intent if status of previous ' +
    'confirmed redeem intent is declared', async function () {

      let nonce = new BN(redeemRequest.nonce, 16);
      await eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        nonce,
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
          nonce.addn(1),
          redeemRequest.beneficiary,
          redeemRequest.amount,
          redeemRequest.gasPrice,
          redeemRequest.gasLimit,
          redeemRequest.blockNumber,
          redeemRequest.hashLock,
          redeemRequest.storageProof,
        ),
        "Previous process is not completed.",
      );
    }
  );

  it('should emit `RedeemIntentConfirmed` event.', async function () {


    let tx = await eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      new BN(redeemRequest.nonce, 16),
      redeemRequest.beneficiary,
      new BN(redeemRequest.amount, 16),
      new BN(redeemRequest.gasPrice, 16),
      new BN(redeemRequest.gasLimit, 16),
      new BN(redeemRequest.blockNumber, 16),
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    let event = EventDecoder.getEvents(tx, eip20Gateway);

    assert.strictEqual(
      tx.receipt.status,
      true,
      'Transaction should success.',
    );

    assert.isDefined(
      event.RedeemIntentConfirmed,
      'Event RedeemIntentConfirmed must be emitted.',
    );

    let eventData = event.RedeemIntentConfirmed;

    let params = TestDataJSON.gateway.confirm_redeem_intent.params;
    let messageHash = TestDataJSON.gateway.confirm_redeem_intent.return_value.returned_value.messageHash_;

    assert.strictEqual(
      eventData._messageHash,
      messageHash,
      `Message hash from event must be equal to ${messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      params.redeemer,
      `Redeemer address from event must be equal to ${params.redeemer}.`,
    );

    let nonce = new BN(params.nonce, 16);
    assert.strictEqual(
      nonce.eq(eventData._redeemerNonce),
      true,
      `Redeemer nonce from event must be equal to ${nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      params.beneficiary,
      `Beneficiary address from event must be equal to ${params.beneficiary}.`,
    );

    let amount = new BN(params.amount, 16);
    assert.strictEqual(
      amount.eq(eventData._amount),
      true,
      `Amount from event must be equal to ${amount.toString(10)}.`,
    );

    let blockHeight = new BN(params.blockNumber, 16);
    assert.strictEqual(
      blockHeight.eq(eventData._blockHeight),
      true,
      `Block height from event must be equal to ${blockHeight.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._hashLock,
      params.hashLock,
      `Hash lock from event must be equal to ${params.hashLock}.`,
    );

  });

  it('should confirm new redeem intent if status of previous ' +
    'confirmed redeem intent is revoked', async function () {

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
        TestDataJSON.gateway.confirm_redeem_intent.return_value.returned_value.messageHash_,
        MessageStatusEnum.Revoked,
      );

      redeemRequest = TestDataJSON2.gateway.confirm_redeem_intent.params;

      await eip20Gateway.setStorageRoot(
        new BN(redeemRequest.blockNumber, 16),
        redeemRequest.storageRoot,
      );

      await confirmRedeemIntent(TestDataJSON2);
    }
  );

  it('should confirm new redeem intent if status of previous ' +
    'confirmed redeem intent is progressed', async function () {

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
        TestDataJSON.gateway.confirm_redeem_intent.return_value.returned_value.messageHash_,
        MessageStatusEnum.Revoked,
      );
      redeemRequest = TestDataJSON2.gateway.confirm_redeem_intent.params;

      await eip20Gateway.setStorageRoot(
        new BN(redeemRequest.blockNumber, 16),
        redeemRequest.storageRoot
      );

      await confirmRedeemIntent(TestDataJSON2);
    }
  );

});
