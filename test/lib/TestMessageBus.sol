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
    bytes32 hashLock = keccak256(abi.encodePacked(unlockSecret));
    bytes32 intentHash = keccak256(abi.encodePacked('intent'));
    uint256 nonce = 1;
    uint256 gasPrice = 0x12A05F200;
    address sender = 0x01db94fdca0ffedc40a6965de97790085d71b412;
    uint256 gasConsumed = 0;

    bytes rlpEncodedParentNodes = '' ;
    uint8 outboxOffset = 0;
    bytes32 storageRoot = bytes32(0);
    bytes signature = '';
    Hasher hasher = new Hasher();

    event Test(uint256 status);

    /* External Functions */
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
        emit Test(uint256(messageBox.inbox[messageHash]));
//        Assert.equal(
//            messageBox.inbox[messageHash],
//            MessageBus.MessageStatus.Progressed,
//            "Status not changed to progressed."
//        );
    }

//    function testProgressInboxWithProof()
//        external
//    {
//        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;
//        MessageBus.progressInboxWithProof(
//            messageBox,
//            Hasher.STAKE_TYPEHASH,
//            getMessage(),
//            rlpEncodedParentNodes,
//            outboxOffset,
//            storageRoot,
//            MessageBus.MessageStatus.Declared
//        );
//
//        Assert.equal(
//            messageBox.inbox[messageHash].status,
//            MessageBus.MessageStatus.Progressed,
//            "Status not changed to progressed."
//        );
//    }
//
//    function testDeclareRevocationMessage()
//        external
//    {
//        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;
//        MessageBus.declareRevocationMessage(
//            messageBox,
//            Hasher.STAKE_TYPEHASH,
//            getMessage(),
//            signature
//        );
//
//        Assert.equal(
//            messageBox.inbox[messageHash].status,
//            MessageBus.MessageStatus.DeclaredRevocation,
//            "Status not changed to DeclaredRevocation."
//        );
//    }
//
//    function testConfirmRevocation()
//        external
//        returns (bytes32 status_)
//    {
//        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;
//        MessageBus.confirmRevocation(
//            messageBox,
//            Hasher.STAKE_TYPEHASH,
//            getMessage(),
//            rlpEncodedParentNodes,
//            outboxOffset,
//            storageRoot
//        );
//
//        Assert.equal(
//            messageBox.inbox[messageHash].status,
//            MessageBus.MessageStatus.DeclaredRevocation,
//            "Status not changed to DeclaredRevocation."
//        );
//    }

    /* Private Functions */
    function getMessageDigest()
        private
        view
        returns(bytes32 /* Message hash */)
    {
        return MessageBus.messageDigest(hasher.stakeTypeHash(), intentHash, nonce, gasPrice);
    }

    function setMessage()
        private
    {
        message = MessageBus.Message({
            intentHash : intentHash,
            nonce : nonce,
            gasPrice : gasPrice,
            sender : sender,
            hashLock : hashLock,
            gasConsumed: gasConsumed
        });
    }


}
