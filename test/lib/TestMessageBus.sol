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
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

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
     * @notice it tests declare message method of MockMessageBus.
     */
    function testDeclareMessage()
        public
    {
        bytes32 messageHash = getBytes32("MESSAGE_BUS_DIGEST");
        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.Undeclared;
        bytes32 messageHashFromDeclare = MockMessageBus.declareMessage(
            messageBox,
            message
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

        messageBox.outbox[messageHash] = MockMessageBus.MessageStatus.DeclaredRevocation;
        messageHashFromProgressOutboxRevocation = MockMessageBus.progressOutboxRevocation(
            messageBox,
            message,
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

