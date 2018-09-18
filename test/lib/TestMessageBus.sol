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
import "../../test/test_lib/KeyValueStoreStub.sol";

/**
 * @title Tests the MessageBus library.
 */
contract TestMessageBus is KeyValueStoreStub {

    constructor()
        public
        KeyValueStoreStub()
    {

    }

    /* External Functions */
    // TODO -ve test cases
    // TODO move hardcoded values to data contract
    function testProgressInbox()
        external
    {
        bytes32 messageHash = getBytes32(
            "MESSAGE_BUS_DIGEST"
        );
        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;

        bytes32 returnedMessageHash = MessageBus.progressInbox(
            messageBox,
            hasher.stakeTypeHash(),
            message,
            getBytes32("UNLOCK_SECRET")
        );
        Assert.equal(
            bytes32(returnedMessageHash),
            bytes32(messageHash),
            "Returned message hash not equal to passed messageHash."
        );
        Assert.equal(
            uint256(messageBox.inbox[messageHash]),
            uint256(MessageBus.MessageStatus.Progressed),
            "Status not changed to progressed."
        );
    }

    function testVerifySignature()
        external
    {
        bytes memory signature = hex"1d1491a8373bcd39c9b779edc17e391dcf5f34becae481594e7e9fc9f1df6807399d4d13735e0e54e95f848a648856c2499de7a94832192e2038e0374f14bc211b";
        Assert.equal(
            MessageBus.verifySignature(
                getBytes32("HASHED_MESSAGE_TO_SIGN"),
                signature,
                address(0)
            ),
            false,
            "Signer is not verified when signer address is empty."
        );
        Assert.equal(
            MessageBus.verifySignature(
                getBytes32("HASHED_MESSAGE_TO_SIGN"),
                '',
                getAddress("SENDER")
            ),
            false,
            "Signer is not verified when signature is empty."
        );
        Assert.equal(
            MessageBus.verifySignature(
                getBytes32("HASHED_MESSAGE_TO_SIGN"),
                signature,
                getAddress("SENDER")
            ),
            true,
            "Signer not verified."
        );
    }

    function testDeclareRevocationMessage()
        external
    {
        // Calculated by hashing revocationMessage
        bytes memory revocationSignature = hex"bda7f05d7bcbac276482ff0809c532edd57b10cce5638d3dede72bfd73a3ef3140e200b0a0e313beacdb79491d387000949751f2e6fe7eec4c03044ecc14fc2d00";
        bytes32 messageHash = getBytes32(
            "MESSAGE_BUS_DIGEST"
        );
        messageBox.outbox[messageHash] = MessageBus.MessageStatus.Declared;
        bytes32 returnedMessageHash = MessageBus.declareRevocationMessage(
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
            uint256(MessageBus.MessageStatus.DeclaredRevocation),
            "Status not changed to DeclaredRevocation."
        );
    }

    function testChangeInboxState()
        external
    {
        bool isChanged;
        MessageBus.MessageStatus nextState;
        bytes32 messageHash = getBytes32(
            "MESSAGE_BUS_DIGEST"
        );
        // Test Undeclared => Declared
        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Undeclared;
        (isChanged, nextState) = MessageBus.changeInboxState(
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
            uint256(MessageBus.MessageStatus.Declared),
            "nextState not changed to Declared."
        );

        // Test Declared => Progressed
        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;
        (isChanged, nextState) = MessageBus.changeInboxState(
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
            uint256(MessageBus.MessageStatus.Progressed),
            "nextState not changed to Progressed."
        );

        // Test DeclaredRevocation => Revoked
        messageBox.inbox[messageHash] = MessageBus.MessageStatus.DeclaredRevocation;
        (isChanged, nextState) = MessageBus.changeInboxState(
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
            uint256(MessageBus.MessageStatus.Revoked),
            "nextState not changed to Revoked."
        );
    }

    function testChangeOutboxState()
        external
    {
        bool isChanged;
        MessageBus.MessageStatus nextState;
        bytes32 messageHash = getBytes32(
            "MESSAGE_BUS_DIGEST"
        );

        // Test Undeclared => Declared
        messageBox.outbox[messageHash] = MessageBus.MessageStatus.Undeclared;
        (isChanged, nextState) = MessageBus.changeOutboxState(
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
            uint256(MessageBus.MessageStatus.Declared),
            "nextState not changed to Declared."
        );

        // Test Declared => Progressed
        messageBox.outbox[messageHash] = MessageBus.MessageStatus.Declared;
        (isChanged, nextState) = MessageBus.changeOutboxState(
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
            uint256(MessageBus.MessageStatus.Progressed),
            "nextState not changed to Progressed."
        );

        // Test DeclaredRevocation => Revoked
        messageBox.outbox[messageHash] = MessageBus.MessageStatus.DeclaredRevocation;
        (isChanged, nextState) = MessageBus.changeOutboxState(
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
            uint256(MessageBus.MessageStatus.Revoked),
            "nextState not changed to Revoked."
        );
    }

}
