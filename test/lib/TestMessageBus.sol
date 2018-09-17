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
import "../../contracts/gateway/MessageBus.sol";
import "../../contracts/gateway/Hasher.sol";

/**
 * @title Tests the MessageBus library.
 */
contract TestMessageBus {

    MessageBus.MessageBox messageBox;
    MessageBus.Message message;

    bytes32 unlockSecret = keccak256(abi.encodePacked('secret'));
    bytes32 unlockSecret1 = keccak256(abi.encodePacked('secret1'));
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

    /* Signature Verification Parameters */
    address sender = address(0x8014986b452de9f00ff9b036dcbe522f918e2fe4);
    bytes32 hashedMessage = 0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a;

    bytes32 messageTypeHash = keccak256(abi.encodePacked("gatewayLink"));


    /* External Functions */
    // TODO test fail cases
    // TODO refactor repeat code. in before callback
    function testProgressInbox(
    )
        external
    {
        bytes32 messageHash = getMessageDigest();
        setMessage();
        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;

        MessageBus.progressInbox(
            messageBox,
            hasher.stakeTypeHash(),
            message,
            unlockSecret
        );
        Assert.equal(
            uint256(messageBox.inbox[messageHash]),
            uint256(MessageBus.MessageStatus.Progressed),
            "Status not changed to progressed."
        );
    }

//    function testProgressInboxWithProof()
//        external
//    {
//        bytes32 messageHash = getMessageDigest();
//        setMessage();
//        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;
//        MessageBus.progressInboxWithProof(
//            messageBox,
//            hasher.stakeTypeHash(),
//            message,
//            rlpEncodedParentNodes,
//            outboxOffset,
//            storageRoot,
//            MessageBus.MessageStatus.Declared
//        );
//
//        Assert.equal(
//            uint256(messageBox.inbox[messageHash]),
//            uint256(MessageBus.MessageStatus.Progressed),
//            "Status not changed to progressed."
//        );
//    }

    function testVerifySignature()
        external
    {
        bytes memory signature = new bytes(65);
        signature = hex"1d1491a8373bcd39c9b779edc17e391dcf5f34becae481594e7e9fc9f1df6807399d4d13735e0e54e95f848a648856c2499de7a94832192e2038e0374f14bc211b";
        Assert.equal(
            MessageBus.verifySignature(hashedMessage, signature, address(0)),
            false,
            "Signer is not verified when signer address is empty."
        );
        Assert.equal(
            MessageBus.verifySignature(hashedMessage, '', sender),
            false,
            "Signer is not verified when signature is empty."
        );
        Assert.equal(
            MessageBus.verifySignature(hashedMessage, signature, sender),
            true,
            "Signer not verified."
        );
    }

//    function testDeclareRevocationMessage()
//        external
//    {
//        bytes32 messageHash = getMessageDigest();
//        setMessage();
//        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;
//        MessageBus.declareRevocationMessage(
//            messageBox,
//            hasher.stakeTypeHash(),
//            message,
//            signature
//        );
//
//        Assert.equal(
//            uint256(messageBox.inbox[messageHash]),
//            uint256(MessageBus.MessageStatus.DeclaredRevocation),
//            "Status not changed to DeclaredRevocation."
//        );
//    }
//
//    function testConfirmRevocation()
//        external
//    {
//        bytes32 messageHash = getMessageDigest();
//        setMessage();
//        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;
//        MessageBus.confirmRevocation(
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
//            uint256(MessageBus.MessageStatus.DeclaredRevocation),
//            "Status not changed to DeclaredRevocation."
//        );
//    }

    /* Private Functions */
    function getMessageDigest()
        private
        view
        returns(bytes32 /* Message hash */)
    {
        return MessageBus.messageDigest(
                hasher.stakeTypeHash(),
                intentHash,
                nonce,
                gasPrice,
                gasLimit
        );
    }

    function setMessage()
        private
    {
        message = MessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            gasLimit : gasLimit,
            sender : sender,
            hashLock : hashLock,
            gasConsumed: gasConsumed
        });
    }

    /**
     *
     *
     *
     *
     *
     *
     *
     */
    function testDeclareMessage()
        public
    {
        bytes memory signature = new bytes(65);
        signature = hex"5dff9e41fdbc3b145894b7ddcee057473fabc4df153c04c10a81871591891176659af33bcc924b0dcdc2b3a41de7df690dbdb68db34a45fefde97b74bde0625100";

        message = MessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            gasLimit : 0,
            hashLock : hashLock,
            gasConsumed: 0
            });

        bytes32 messageHash = MessageBus.declareMessage(
            messageBox,
            messageTypeHash,
            message, signature
        );
        Assert.equal(
            uint256(messageBox.outbox[messageHash]),
            uint256(MessageBus.MessageStatus.Declared),
            "Status not changed to Declared."
        );
    }

    function testMessageDigest()
        public
        returns (bytes32 )
    {


        return (MessageBus.messageDigest(
            messageTypeHash,
            intentHash,
            nonce,
            gasPrice,
            gasLimit
        ));

    }


}
