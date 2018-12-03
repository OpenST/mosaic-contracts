pragma solidity ^0.5.0;

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
import "../../contracts/test/test_lib/KeyValueStoreStub.sol";

/**
 * @title Tests the MessageBus library.
 */
contract TestMessageBus is KeyValueStoreStub{

    constructor()
        public
        KeyValueStoreStub()
    {}

    /* External Functions */

    /**
     * @notice it tests progress inbox method of messageBus.
     */
    function testProgressInbox()
        external
    {
        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;

        bytes32 returnedMessageHash = MockMessageBus.progressInbox(
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
            uint256(MockMessageBus.MessageStatus.Progressed),
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
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 returnedMessageHash = MockMessageBus.declareRevocationMessage(
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
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
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
        MockMessageBus.MessageStatus nextState;
        bytes32 messageHash = getBytes32(
            "MESSAGE_BUS_DIGEST"
        );
        // Test Undeclared => Declared
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Undeclared;
        (isChanged, nextState) = MockMessageBus.changeInboxState(
            messageBox,
            messageHash
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
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
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
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
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
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

    /**
     * @notice it tests change outbox state method of MockMessageBus.
     */
    function testChangeOutboxState()
        external
    {
        bool isChanged;
        MockMessageBus.MessageStatus nextState;
        bytes32 messageHash = getBytes32(
            "MESSAGE_BUS_DIGEST"
        );

        // Test Undeclared => Declared
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Undeclared;
        (isChanged, nextState) = MockMessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged is not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Declared),
            "nextState is not changed to Declared."
        );

        // Test Declared => Progressed
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        (isChanged, nextState) = MockMessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "nextState should not be equal to Revoked."
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged is not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "nextState is not changed to Progressed."
        );

        // Test DeclaredRevocation => Revoked
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        (isChanged, nextState) = MockMessageBus.changeOutboxState(
            messageBox,
            messageHash
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Undeclared),
            "nextState should not be equal to Undeclared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Declared),
            "nextState should not be equal to Declared."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "nextState should not be equal to Progressed."
        );
        Assert.notEqual(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.DeclaredRevocation),
            "nextState should not be equal to DeclaredRevocation."
        );
        Assert.equal(
            bool(isChanged),
            true,
            "isChanged is not equal to true."
        );
        Assert.equal(
            uint256(nextState),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "nextState is not changed to Revoked."
        );
    }

    /**
     * @notice it tests declare message method of MockMessageBus.
     */
    function testDeclareMessage()
        public
    {
        bytes memory signature = new bytes(65);
        signature = hex"b3ea4cd2196f5723de9bda449c8bb7745a444383f27586148a358ab855aed1bd4b9b3ebf0920982d016b6b5eaa00a83ddf1b07bb9b154677f005d08db5c5240d00";

        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Undeclared;
        bytes32 messageHashFromDeclare = MockMessageBus.declareMessage(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
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

    /**
     * @notice it tests progress outbox method of messageBus.
     */
    function testProgressOutbox()
        public
    {

        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromOutbox = MockMessageBus.progressOutbox(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes32("UNLOCK_SECRET")
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

    /**
     * @notice it tests confirm message method of messageBus.
     */
    function testConfirmMessage()
        public
    {

        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Undeclared;
        bytes32 messageHashFromConfirm = MockMessageBus.confirmMessage(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes("RLP_PARENT_NODES"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes32("STORAGE_ROOT")
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromConfirm]),
            uint256(MockMessageBus.MessageStatus.Declared),
            "Status not changed to Declared."
        );

        Assert.equal(
            messageHash,
            messageHashFromConfirm,
            "Message hash not equal"
        );
    }

    /**
     * @notice it tests progress inbox with proof method of messageBus if
     *         inbox status is declared.
     */
    function testProgressInboxWithProofIfInboxIsDeclared()
        public
    {

        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        // When the state for messageHash in inbox is Declared
        // with outbox state for messageHash is Declared
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromProgressInboxWithProof = MockMessageBus.progressInboxWithProof(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes("RLP_PARENT_NODES"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes32("STORAGE_ROOT"),
            MockMessageBus.MessageStatus.Declared
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromProgressInboxWithProof]),
            uint256(MockMessageBus.MessageStatus.Progressed),
            "Status not changed to Progressed."
        );

    }

    /**
     * @notice it tests progress inbox with proof method of messageBus
     *         if inbox status is progressed.
     */
    function testProgressInboxWithProofIfInboxIsProgressed()
        public
    {
        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromProgressInboxWithProof = MockMessageBus.progressInboxWithProof(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes("RLP_PARENT_NODES"),
            1,
            getBytes32("STORAGE_ROOT"),
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

    /**
     * @notice it tests progress outbox with proof method of messageBus if
     *         outbox and inbox status is declared.
     */
    function testProgressOutboxWithProofODID()
        public
    {

        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromOutboxWithProof = MockMessageBus.progressOutboxWithProof(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes("RLP_PARENT_NODES"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes32("STORAGE_ROOT"),
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

    }

    /**
     * @notice it tests progress outbox with proof method of messageBus
     *         if outbox status is declared and inbox status is progressed.
     */
    function testProgressOutboxWithProofODIP()
        public
    {
        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromOutboxWithProof = MockMessageBus.progressOutboxWithProof(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes("RLP_PARENT_NODES"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes32("STORAGE_ROOT"),
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

    /**
     * @notice it tests progress outbox with proof method of messageBus
     *         if outbox status is declared revocation and inbox status is
     *         progressed.
     */
    function testProgressOutboxWithProofODRIP()
        public
    {
        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        bytes32 messageHashFromOutboxWithProof = MockMessageBus.progressOutboxWithProof(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes("RLP_PARENT_NODES"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes32("STORAGE_ROOT"),
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

    /**
     * @notice it tests confirm revocation method of MessageBus.
     */
    function testConfirmRevocation()
        public
    {

        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");

        messageBox.inbox[messageHash] = MockMessageBus.MessageStatus.Declared;
        bytes32 messageHashFromConfirmRevocation = MockMessageBus.confirmRevocation(
            messageBox,
            getBytes32("STAKE_TYPEHASH"),
            message,
            getBytes("RLP_PARENT_NODES"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes32("STORAGE_ROOT")
        );

        Assert.equal(
            uint256(messageBox.inbox[messageHashFromConfirmRevocation]),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "Status not changed to Revoked."
        );

        Assert.equal(
            messageHash,
            messageHashFromConfirmRevocation,
            "Message hash not equal"
        );

    }

    /**
     * @notice it tests progress outbox revocation method of messageBus.
     */
    function testProgressOutboxRevocation()
        public
    {

        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");

        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        bytes32 messageHashFromProgressOutboxRevocation = MockMessageBus.progressOutboxRevocation(
            messageBox,
            message,
            getBytes32("STAKE_TYPEHASH"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes("RLP_PARENT_NODES"),
            getBytes32("STORAGE_ROOT"),
            MockMessageBus.MessageStatus.DeclaredRevocation
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromProgressOutboxRevocation]),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "Status not changed to Revoked."
        );

        Assert.equal(
            messageHash,
            messageHashFromProgressOutboxRevocation,
            "Message hash not equal"
        );

        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        messageHashFromProgressOutboxRevocation = MockMessageBus.progressOutboxRevocation(
            messageBox,
            message,
            getBytes32("STAKE_TYPEHASH"),
            uint8(getUint256("MESSAGEBOX_OFFSET")),
            getBytes("RLP_PARENT_NODES"),
            getBytes32("STORAGE_ROOT"),
            MockMessageBus.MessageStatus.Revoked
        );

        Assert.equal(
            uint256(messageBox.outbox[messageHashFromProgressOutboxRevocation]),
            uint256(MockMessageBus.MessageStatus.Revoked),
            "Status not changed to Revoked."
        );

        Assert.equal(
            messageHash,
            messageHashFromProgressOutboxRevocation,
            "Message hash not equal"
        );
    }


}

