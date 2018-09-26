pragma solidity ^0.4.23;

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

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../../contracts/gateway/MockMessageBus.sol";
import "../../contracts/gateway/Hasher.sol";
//import "./KeyValueStoreStub.sol";


/**
 * @title Tests the MessageBus library.
 */
contract TestMessageBus { //is KeyValueStoreStub{

    MockMessageBus.MessageBox messageBox;

    bytes32 unlockSecret = keccak256(abi.encodePacked('secret'));
    bytes32 hashLock = keccak256(abi.encodePacked(unlockSecret));
    bytes32 intentHash = keccak256(abi.encodePacked('intent'));
    uint256 nonce = 1;
    uint256 gasPrice = 0x12A05F200;
    uint256 gasLimit = 0x12A05F200;
    uint256 gasConsumed = 0;

    bytes rlpEncodedParentNodes = '0xf8f8f8b18080a011eb05caf5fa62e9b0fffc9118cf6c7a6f10870db11d837223bf585fc7283b2c80a0be65b7596c589a734b53d15e0cc9f13eae2083bf0173b1c2baf1534d9273882d8080808080a0997f2ab256882c505e8887d9f7622a18a17dc5727a0e9d04d314e59d482a508780a088976b814f3477b2d25aa3992c31abc4a4299557a6e94ca7786a440b15a07f1e80a04b140101c7c54b2c4d69e4cf35a353d7d969e439c48fe7388eaec325f1bfe6578080f843a0390decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563a1a03132333400000000000000000000000000000000000000000000000000000008' ;
    uint8 outboxOffset = 0;
    bytes32 storageRoot = 0x70b4172eb30c495bf20b5b12224cd2380fccdd7ffa2292416b9dbdfc8511585d;
    Hasher hasher = new Hasher();

    bytes32 messageTypeHash = keccak256(abi.encodePacked("gatewayLink"));


    /* Signature Verification Parameters */
    address sender = address(0x8014986b452DE9f00ff9B036dcBe522f918E2fE4);
    bytes32 hashedMessage = 0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a;
    bytes32 messageHash = MockMessageBus.messageDigest(
        hasher.stakeTypeHash(),
        intentHash,
        nonce,
        gasPrice,
        gasLimit
    );
    MockMessageBus.Message message = MockMessageBus.Message({
        intentHash : intentHash,
        nonce : nonce,
        gasPrice : gasPrice,
        gasLimit : gasLimit,
        sender : sender,
        hashLock : hashLock,
        gasConsumed: gasConsumed
        });

    /* External Functions */
    // TODO -ve test cases
    // TODO move hardcoded values to data contract
    function testProgressInbox()
        external
    {
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;

        bytes32 returnedMessageHash = MockMessageBus.progressInbox(
            messageBox,
            hasher.stakeTypeHash(),
            message,
            unlockSecret
        );
        Assert.equal(
            bytes32(returnedMessageHash),
            bytes32(messageHash),
            "Returned message hash not equal to passed messageHash."
        );
        Assert.equal(
            uint256(messageBox.inbox[messageHash]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to progressed."
        );
    }

    function testVerifySignature()
        external
    {
        bytes memory signature = hex"1d1491a8373bcd39c9b779edc17e391dcf5f34becae481594e7e9fc9f1df6807399d4d13735e0e54e95f848a648856c2499de7a94832192e2038e0374f14bc211b";
        Assert.equal(
            MockMessageBus.verifySignature(hashedMessage, signature, address(0)),
            false,
            "Signer is not verified when signer address is empty."
        );
        Assert.equal(
            MockMessageBus.verifySignature(hashedMessage, '', sender),
            false,
            "Signer is not verified when signature is empty."
        );
        Assert.equal(
            MockMessageBus.verifySignature(hashedMessage, signature, sender),
            true,
            "Signer not verified."
        );
    }

    function testDeclareRevocationMessage()
        external
    {
        // Calculated by hashing revocationMessage
        bytes memory revocationSignature = hex"bda7f05d7bcbac276482ff0809c532edd57b10cce5638d3dede72bfd73a3ef3140e200b0a0e313beacdb79491d387000949751f2e6fe7eec4c03044ecc14fc2d00";
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 returnedMessageHash = MockMessageBus.declareRevocationMessage(
            messageBox,
            hasher.stakeTypeHash(),
            message,
            revocationSignature
        );
        Assert.equal(
            bytes32(returnedMessageHash),
            bytes32(messageHash),
            "Returned message hash not equal to passed messageHash."
        );
        Assert.equal(
            uint256(messageBox.outbox[messageHash]),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "Status not changed to DeclaredRevocation."
        );
    }

    //    function testConfirmRevocation()
    //        external
    //    {
    //        bytes32 messageHash = getMessageDigest();
    //        setMessage();
    //        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
    //        MockMessageBus.confirmRevocation(
    //            messageBox,
    //            hasher.stakeTypeHash(),
    //            message,
    //            rlpEncodedParentNodes,
    //            outboxOffset,
    //            storageRoot
    //        );
    //
    //        Assert.equal(
    //            uint256(messageBox.inbox[messageHash]),
    //            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
    //            "Status not changed to DeclaredRevocation."
    //        );
    //    }

    function testChangeInboxState()
        external
    {
        bool isChanged;
        MockMessageBus.MessageStatus nextState;

        // Test Undeclared => Declared
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Undeclared;
        (isChanged, nextState) = MockMessageBus.changeInboxState(
            messageBox,
            messageHash
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Declared),
            "nextState not changed to Declared."
        );

        // Test Declared => Progressed
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        (isChanged, nextState) = MockMessageBus.changeInboxState(
            messageBox,
            messageHash
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "nextState not changed to Progressed."
        );

        // Test DeclaredRevocation => Revoked
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        (isChanged, nextState) = MockMessageBus.changeInboxState(
            messageBox,
            messageHash
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "nextState not changed to Revoked."
        );
    }

    function testChangeOutboxState()
        external
    {
        bool isChanged;
        MockMessageBus.MessageStatus nextState;

        // Test Undeclared => Declared
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Undeclared;
        (isChanged, nextState) = MockMessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Declared),
            "nextState not changed to Declared."
        );

        // Test Declared => Progressed
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        (isChanged, nextState) = MockMessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.equal(
            bool(isChanged),
            true,
            " isChanged not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "nextState not changed to Progressed."
        );

        // Test DeclaredRevocation => Revoked
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        (isChanged, nextState) = MockMessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "nextState not changed to Revoked."
        );
    }

    function testDeclareMessage()
        public
    {
        bytes memory signature = new bytes(65);
        signature = hex"5dff9e41fdbc3b145894b7ddcee057473fabc4df153c04c10a81871591891176659af33bcc924b0dcdc2b3a41de7df690dbdb68db34a45fefde97b74bde0625100";

        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
        });
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";
        bytes32 messageHashFromDeclare = MockMessageBus.declareMessage(
            messageBox,
            messageTypeHash,
            message,
            signature
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromDeclare]),
            uint256(MockMessageBus.MessageStatus.Declared),
            "Status not changed to Declared."
        );

        Assert.equal(
            messageHash,
            messageHashFromDeclare,
            "Message hash not equal"
        );
    }

    function testProgressOutbox()
        public
    {
        bytes memory signature = new bytes(65);
        signature = hex"5dff9e41fdbc3b145894b7ddcee057473fabc4df153c04c10a81871591891176659af33bcc924b0dcdc2b3a41de7df690dbdb68db34a45fefde97b74bde0625100";
        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
        });
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromOutbox = MockMessageBus.progressOutbox(
            messageBox,
            messageTypeHash,
            message,
            unlockSecret
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromOutbox]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );
        Assert.equal(
            messageHash,
            messageHashFromOutbox,
            "Message hash not equal."
        );
    }

    function testConfirmMessage()
        public
    {
        bytes memory signature = new bytes(65);
        signature = hex"5dff9e41fdbc3b145894b7ddcee057473fabc4df153c04c10a81871591891176659af33bcc924b0dcdc2b3a41de7df690dbdb68db34a45fefde97b74bde0625100";
        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
        });
        bytes memory rlpEncodedParentNodes = hex'f9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';
        bytes32 storageRoot = hex"9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771";
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromConfirm = MockMessageBus.confirmMessage(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromConfirm]),
            uint256(MockMessageBus.MessageStatus.Declared),
            "Status not changed to Declared."
        );

        Assert.equal(
            messageHash,
            messageHashFromConfirm,
            "Message hash not equal"
        );
    }

    function testProgressInboxWithProof()
        public
    {

        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
        });
        bytes memory rlpEncodedParentNodes = hex'f9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';
        bytes32 storageRoot = hex"9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771";
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";

        // When the state for messageHash in inbox is Declared
        // with outbox state for messageHash is Declared
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromProgressInboxWithProof = MockMessageBus.progressInboxWithProof(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot,
            MockMessageBus.MessageStatus.Declared
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromProgressInboxWithProof]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );

        // When the state for messageHash in inbox is Progressed
        // with outbox state for messageHash is Declared
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        messageHashFromProgressInboxWithProof = MockMessageBus.progressInboxWithProof(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot,
            MockMessageBus.MessageStatus.Progressed
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromProgressInboxWithProof]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );

        Assert.equal(
            messageHash,
            messageHashFromProgressInboxWithProof,
            "Message hash not equal"
        );

    }


    function testProgressOutboxWithProof()
        public
    {

        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
        });
        bytes memory rlpEncodedParentNodes = hex'f9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';
        bytes32 storageRoot = hex"9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771";
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";

        // When the state for messageHash in inbox is Declared
        // with outbox state for messageHash is Declared
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromOutboxWithProof = MockMessageBus.progressOutboxWithProof(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot,
            MockMessageBus.MessageStatus.Declared
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromOutboxWithProof]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );

        Assert.equal(
            messageHash,
            messageHashFromOutboxWithProof,
            "Message hash not equal"
        );

        // When the state for messageHash in inbox is Declared
        // with outbox state for messageHash is DeclaredRevocation
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        messageHashFromOutboxWithProof = MockMessageBus.progressOutboxWithProof(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot,
            MockMessageBus.MessageStatus.Declared
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromOutboxWithProof]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );

        Assert.equal(
            messageHash,
            messageHashFromOutboxWithProof,
            "Message hash not equal"
        );

        // When the state for messageHash in inbox is Progressed
        // with outbox state for messageHash is Declared
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        messageHashFromOutboxWithProof = MockMessageBus.progressOutboxWithProof(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot,
            MockMessageBus.MessageStatus.Progressed
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromOutboxWithProof]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );

        Assert.equal(
            messageHash,
            messageHashFromOutboxWithProof,
            "Message hash not equal"
        );

         // When the state for messageHash in inbox is Progressed
         // with outbox state for messageHash is Declared
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        messageHashFromOutboxWithProof = MockMessageBus.progressOutboxWithProof(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot,
            MockMessageBus.MessageStatus.Progressed
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromOutboxWithProof]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );

        Assert.equal(
            messageHash,
            messageHashFromOutboxWithProof,
            "Message hash not equal"
        );

    }

    function testConfirmRevocation()
        public
    {
        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
        });
        bytes memory rlpEncodedParentNodes = hex'f9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';
        bytes32 storageRoot = hex"9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771";
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";

        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromConfirmRevocation = MockMessageBus.confirmRevocation(
            messageBox,
            messageTypeHash,
            message,
            rlpEncodedParentNodes,
            1,
            storageRoot
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromConfirmRevocation]),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "Status not changed to Declared."
        );

        Assert.equal(
            messageHash,
            messageHashFromConfirmRevocation,
            "Message hash not equal"
        );

    }

    function testProgressInboxRevocation()
        public
    {
        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
        });
        bytes memory rlpEncodedParentNodes = hex'f9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';
        bytes32 storageRoot = hex"9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771";
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";

        // When the state for messageHash in inbox is DeclaredRevocation
        // with outbox state for messageHash is DeclaredRevocation
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        bytes32 messageHashFromProgressInboxRevocation = MockMessageBus.progressInboxRevocation(
            messageBox,
            message,
            messageTypeHash,
            1,
            rlpEncodedParentNodes,
            storageRoot,
            MockMessageBus.MessageStatus.DeclaredRevocation
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromProgressInboxRevocation]),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "Status not changed to Revoked."
        );

        Assert.equal(
            messageHash,
            messageHashFromProgressInboxRevocation,
            "Message hash not equal"
        );

        // When the state for messageHash in inbox is Revoked
        // with outbox state for messageHash is Revoked
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        messageHashFromProgressInboxRevocation = MockMessageBus.progressInboxRevocation(
            messageBox,
            message,
            messageTypeHash,
            1,
            rlpEncodedParentNodes,
            storageRoot,
            MockMessageBus.MessageStatus.Revoked
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromProgressInboxRevocation]),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "Status not changed to Revoked."
        );

        Assert.equal(
            messageHash,
            messageHashFromProgressInboxRevocation,
            "Message hash not equal"
        );
    }


    function testProgressOutboxRevocation()
        public
    {
        message = MockMessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
            });
        bytes memory rlpEncodedParentNodes = hex'f9019ff901318080a09d4484981c7edad9f3182d5ae48f8d9d37920c6b38a2871cebef30386741a92280a0e159e6e0f6ff669a91e7d4d1cf5eddfcd53dde292231841f09dd29d7d29048e9a0670573eb7c83ac10c87de570273e1fde94c1acbd166758e85aeec2219669ceb5a06f09c8eefdb579cae94f595c48c0ee5e8052bef55f0aeb3cc4fac8ec1650631fa05176aab172a56135b9d01a89ccada74a9d11d8c33cbd07680acaf9704cbec062a0df7d6e63240928af91e7c051508a0306389d41043954c0e3335f6f37b8e53cc18080a03d30b1a0d2a61cafd83521c5701a8bf63d0020c0cd9e844ad62e9b4444527144a0a5aa2db9dc726541f2a493b79b83aeebe5bc8f7e7910570db218d30fa7d2ead18080a0b60ddc26977a026cc88f0d5b0236f4cee7b93007a17e2475547c0b4d59d16c3d80f869a034d7a0307ecd0d12f08317f9b12c4d34dfbe55ec8bdc90c4d8a6597eb4791f0ab846f8440280a0e99d9c02761142de96f3c92a63bb0edb761a8cd5bbfefed1e72341a94957ec51a0144788d43dba972c568df04560b995d9e57b58ef09fddf3b68cba065997efff7';
        bytes32 storageRoot = hex"9642e5c7f830dbf5cb985c9a2755ea2e5e560dbe12f98fd19d9b5b6463c2e771";
        bytes32 messageHash = hex"165d879c2a71691e1114a325127f071aba8c7978c3e02455d8c542b05c34c17b";

        // When the state for messageHash in outbox is DeclaredRevocation
        // with inbox state for messageHash is DeclaredRevocation
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        bytes32 messageHashFromProgressOutboxRevocation = MockMessageBus.progressOutboxRevocation(
            messageBox,
            message,
            messageTypeHash,
            1,
            rlpEncodedParentNodes,
            storageRoot,
            MockMessageBus.MessageStatus.DeclaredRevocation
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromProgressOutboxRevocation]),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "Status not changed to Declared."
        );

        Assert.equal(
            messageHash,
            messageHashFromProgressOutboxRevocation,
            "Message hash not equal"
        );

        // When the state for messageHash in inbox is Revoked
        // with outbox state for messageHash is Revoked
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        messageHashFromProgressOutboxRevocation = MockMessageBus.progressOutboxRevocation(
            messageBox,
            message,
            messageTypeHash,
            1,
            rlpEncodedParentNodes,
            storageRoot,
            MockMessageBus.MessageStatus.Revoked
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromProgressOutboxRevocation]),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "Status not changed to Declared."
        );

        Assert.equal(
            messageHash,
            messageHashFromProgressOutboxRevocation,
            "Message hash not equal"
        );
    }


}

