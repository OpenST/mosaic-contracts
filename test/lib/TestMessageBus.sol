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
import "../../contracts/test/test_lib/KeyValueStoreStub.sol";

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

    /**
     * @notice it tests progress inbox method of messageBus.
     */
    function testProgressInbox()
    external
    {
        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.inbox[messageHash] = MessageBus.MessageStatus.Declared;

        bytes32 returnedMessageHash = MessageBus.progressInbox(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
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

    /**
     * @notice it tests declare revocation method of messageBus.
     */
    function testDeclareRevocationMessage()
    external
    {
        // Calculated by hashing revocationMessage
        bytes32 messageHash = getBytes32(
            "MESSAGE_BUS_DIGEST"
        );
        messageBox.outbox[messageHash] = MessageBus.MessageStatus.Declared;
        bytes32 returnedMessageHash = MessageBus.declareRevocationMessage(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message
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

    /**
     * @notice it tests change inbox state method of messageBus.
     */
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
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
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
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
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
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
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

    /**
     * @notice it tests change outbox state method of messageBus.
     */
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
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged is not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Declared),
            "nextState is not changed to Declared."
        );

        // Test Declared => Progressed
        messageBox.outbox[messageHash] = MessageBus.MessageStatus.Declared;
        (isChanged, nextState) = MessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged is not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Progressed),
            "nextState is not changed to Progressed."
        );

        // Test DeclaredRevocation => Revoked
        messageBox.outbox[messageHash] = MessageBus.MessageStatus.DeclaredRevocation;
        (isChanged, nextState) = MessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged is not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MessageBus.MessageStatus.Revoked),
            "nextState is not changed to Revoked."
        );
    }

}
