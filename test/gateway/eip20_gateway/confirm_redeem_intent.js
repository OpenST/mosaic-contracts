const EIP20Gateway = artifacts.require('TestEIP20Gateway.sol');
const Token = artifacts.require("MockUtilityToken");
const Utils = require('../../test_lib/utils');
const MockToken = artifacts.require("MockToken");
const BN = require('bn.js');
const TestData = require('./test_data/confirm_redeem_intent');
const messageBus = require('../../test_lib/message_bus.js');
const MockOrganization = artifacts.require('MockOrganization.sol');
const EventDecoder = require('../../test_lib/event_decoder.js');

let MessageStatusEnum = messageBus.MessageStatusEnum;
contract('EIP20Gateway.confirmRedeemIntent() ', function (accounts) {

  let valueTokenAddress,
    utilityToken,
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
    redeemRequest;

  async function confirmRedeemIntent(redeemRequest) {

    let tx = await eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      new BN(redeemRequest.nonce),
      redeemRequest.beneficiary,
      redeemRequest.amount,
      new BN(redeemRequest.gasPrice),
      new BN(redeemRequest.gasLimit),
      new BN(redeemRequest.blockNumber),
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    let event = EventDecoder.getEvents(tx, eip20Gateway);

    assert.isDefined(
      event.RedeemIntentConfirmed,
      'Event RedeemIntentConfirmed must be emitted.',
    );

    let eventData = event.RedeemIntentConfirmed;

    assert.strictEqual(
      eventData._messageHash,
      redeemRequest.messageHash,
      `Message hash from event must be equal to ${redeemRequest.messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      redeemRequest.redeemer,
      `Staker address from event must be equal to ${redeemRequest.redeemer}.`,
    );

    let nonce = new BN(redeemRequest.nonce);
    assert.strictEqual(
      nonce.eq(eventData._redeemerNonce),
      true,
      `Redeemer nonce from event must be equal to ${nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      redeemRequest.beneficiary,
      `Beneficiary address from event must be equal to ${redeemRequest.beneficiary}.`,
    );

    let amount = new BN(redeemRequest.amount);
    assert.strictEqual(
      amount.eq(eventData._amount),
      true,
      `Amount from event must be equal to ${amount.toString(10)}.`,
    );

    let blockHeight = new BN(redeemRequest.blockNumber);
    assert.strictEqual(
      blockHeight.eq(eventData._blockHeight),
      true,
      `Block height from event must be equal to ${blockHeight.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._hashLock,
      redeemRequest.hashLock,
      `Hash lock from event must be equal to ${redeemRequest.hashLock}.`,
    );
  }

  beforeEach(async function () {

      testData = TestData[0];

      valueTokenAddress = accounts[0];
      mockToken = await MockToken.new({from: accounts[0]});
      baseToken = await MockToken.new({from: accounts[0]});

      redeemRequest = testData.redeemRequest;

      owner = accounts[4];
      worker = accounts[8];

      mockOrganization = await MockOrganization.new(owner, worker);

      // Deploy mocked utility token.
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
      await eip20Gateway.activateGateway(testData.coGateway, {from: owner});
      await eip20Gateway.setStorageRoot(
        redeemRequest.blockNumber,
        redeemRequest.storageRoot,
      );

    }
  );

  it('should pass when all the params are valid', async function () {

      await confirmRedeemIntent(redeemRequest);

    }
  );

  it('should pass when redeemer address is zero', async function () {

      let redeemerAddress = Utils.NULL_ADDRESS;
      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemerAddress,
          new BN(redeemRequest.nonce),
          redeemRequest.beneficiary,
          redeemRequest.amount,
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
          redeemRequest.blockNumber,
          redeemRequest.hashLock,
          redeemRequest.storageProof
        ),
        "Redeemer address must not be zero"
      );

    }
  );

  it('should pass when beneficiary address is zero', async function () {

      let beneficiary = Utils.NULL_ADDRESS;
      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemRequest.redeemer,
          new BN(redeemRequest.nonce),
          beneficiary,
          redeemRequest.amount,
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
          redeemRequest.blockNumber,
          redeemRequest.hashLock,
          redeemRequest.storageProof,
        ),
        "Beneficiary address must not be zero.",
      );

    }
  );

  it('should pass when amount is zero', async function () {

      let amount = 0;
      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemRequest.redeemer,
          new BN(redeemRequest.nonce),
          redeemRequest.beneficiary,
          amount,
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
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
    await Utils.expectRevert(eip20Gateway.confirmRedeemIntent(
      redeemRequest.redeemer,
      new BN(redeemRequest.nonce),
      redeemRequest.beneficiary,
      redeemRequest.amount,
      new BN(redeemRequest.gasPrice),
      new BN(redeemRequest.gasLimit),
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
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
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
          new BN(redeemRequest.nonce),
          redeemRequest.beneficiary,
          redeemRequest.amount,
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
          blockHeight,
          redeemRequest.hashLock,
          redeemRequest.storageProof,
        ),
        "Storage root must not be zero.",
      );
    });

  it('should fail when the rlp parent node is a incorrect proof data.',
    async function () {

      let rlpParentNodes = "0xf9022af901b1a03db383f38d0163e0650266c0b32eabac18b36510d248a66384ae784527b8a260a0184fbe4c37940d5a45831c9e91fa0469b30cc14c3f8b08b12fe5cc11b4629218a0263e1c3b7a11d0c6bb382bbc5a4975136a0244bbb4da8eaf93347684fbefb9e1a0bceef47bf435150cce491fa4c6c1a2ec9626ac7c1c64329ad8921482c7a9471da00c7a9c73ecdd6aa28e7fef237ebbdf3785e090857bc91cc2398e9c3ed8b12bc3a0b6165c303ae5b2c4c7bdecb30e52d926e27b6c859a8859b9f032c9c4da02a5c2a073f2d82ba31bc5ef87f7e2264e5a2a2e044f9d7e81dde0145bcb98185ad06005a0c41bc291c21115b57c1ce6efc0a685076270a5fb0971ad753e15b2a54e1dce3fa08b05b46d725768c8ba2c8fb0dd65ad2f49d471c0651add5e30689c3fd5f71f41a00884f90fd6a4344856200be5473cd52f77b3d9bc688d85930a95aeb2736a721680a0c863951d7a2e1a3bbeca16eb3ce556dd362a033d1614fad4292b34543712de74a0dcc1a63a91bbececd60b695e322f959cac4249e0adf668187a1c80ba9833752da07c416bda5356c3e1d84c5df2207d399d4defc39a3ce8c50a662308ed002a4f7b808080f8518080808080a03f618fed54c36b914c40b3a15a92ea49239350877cc259bd61e2907216c3f4f5808080808080a03bf9ebc1d568a0e0cfbf9f5b95efe1737e1a5ce7f65df410e1c57f34a2b62b0480808080e2a020db4db6eb15ffb315ffbf3c904aa674224090d910e01e64189911526bb8086702";

      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemRequest.redeemer,
          new BN(redeemRequest.nonce),
          redeemRequest.beneficiary,
          redeemRequest.amount,
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
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
        new BN(redeemRequest.nonce),
        redeemRequest.beneficiary,
        redeemRequest.amount,
        new BN(redeemRequest.gasPrice),
        new BN(redeemRequest.gasLimit),
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      );

      await Utils.expectRevert(
        eip20Gateway.confirmRedeemIntent(
          redeemRequest.redeemer,
          new BN(redeemRequest.nonce),
          redeemRequest.beneficiary,
          redeemRequest.amount,
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
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

      let nonce = new BN(redeemRequest.nonce);
      await eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        nonce,
        redeemRequest.beneficiary,
        redeemRequest.amount,
        new BN(redeemRequest.gasPrice),
        new BN(redeemRequest.gasLimit),
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
          new BN(redeemRequest.gasPrice),
          new BN(redeemRequest.gasLimit),
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
      new BN(redeemRequest.nonce),
      redeemRequest.beneficiary,
      redeemRequest.amount,
      new BN(redeemRequest.gasPrice),
      new BN(redeemRequest.gasLimit),
      redeemRequest.blockNumber,
      redeemRequest.hashLock,
      redeemRequest.storageProof,
    );

    let event = EventDecoder.getEvents(tx, eip20Gateway);

    assert.isDefined(
      event.RedeemIntentConfirmed,
      'Event RedeemIntentConfirmed must be emitted.',
    );

    let eventData = event.RedeemIntentConfirmed;

    assert.strictEqual(
      eventData._messageHash,
      redeemRequest.messageHash,
      `Message hash from event must be equal to ${redeemRequest.messageHash}.`,
    );

    assert.strictEqual(
      eventData._redeemer,
      redeemRequest.redeemer,
      `Staker address from event must be equal to ${redeemRequest.redeemer}.`,
    );

    let nonce = new BN(redeemRequest.nonce);
    assert.strictEqual(
      nonce.eq(eventData._redeemerNonce),
      true,
      `Redeemer nonce from event must be equal to ${nonce.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._beneficiary,
      redeemRequest.beneficiary,
      `Beneficiary address from event must be equal to ${redeemRequest.beneficiary}.`,
    );

    let amount = new BN(redeemRequest.amount);
    assert.strictEqual(
      amount.eq(eventData._amount),
      true,
      `Amount from event must be equal to ${amount.toString(10)}.`,
    );

    let blockHeight = new BN(redeemRequest.blockNumber);
    assert.strictEqual(
      blockHeight.eq(eventData._blockHeight),
      true,
      `Block height from event must be equal to ${blockHeight.toString(10)}.`,
    );

    assert.strictEqual(
      eventData._hashLock,
      redeemRequest.hashLock,
      `Hash lock from event must be equal to ${redeemRequest.hashLock}.`,
    );

  });

  it('should confirm new redeem intent if status of previous ' +
    'confirmed redeem intent is revoked', async function () {

      await eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        new BN(redeemRequest.nonce),
        redeemRequest.beneficiary,
        redeemRequest.amount,
        new BN(redeemRequest.gasPrice),
        new BN(redeemRequest.gasLimit),
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      );

      await eip20Gateway.setInboxStatus(redeemRequest.messageHash, MessageStatusEnum.Revoked);

      redeemRequest = TestData[1].redeemRequest;

      await eip20Gateway.setStorageRoot(redeemRequest.blockNumber, redeemRequest.storageRoot);

      await confirmRedeemIntent(redeemRequest);
    }
  );

  it('should confirm new redeem intent if status of previous ' +
    'confirmed redeem intent is progressed', async function () {

      await eip20Gateway.confirmRedeemIntent(
        redeemRequest.redeemer,
        new BN(redeemRequest.nonce),
        redeemRequest.beneficiary,
        redeemRequest.amount,
        new BN(redeemRequest.gasPrice),
        new BN(redeemRequest.gasLimit),
        redeemRequest.blockNumber,
        redeemRequest.hashLock,
        redeemRequest.storageProof,
      );

      await eip20Gateway.setInboxStatus(redeemRequest.messageHash, MessageStatusEnum.Progressed);

      redeemRequest = TestData[1].redeemRequest;

      await eip20Gateway.setStorageRoot(redeemRequest.blockNumber, redeemRequest.storageRoot);

      await confirmRedeemIntent(redeemRequest);
    }
  );

});