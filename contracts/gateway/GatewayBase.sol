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

import "./EIP20Interface.sol";
import "../lib/MessageBus.sol";
import "../StateRootInterface.sol";
import "../lib/GatewayLib.sol";
import "../lib/OrganizationInterface.sol";
import "../lib/Organized.sol";
import "../lib/SafeMath.sol";

/**
 *  @title GatewayBase is the base contract for EIP20Gateway and EIP20CoGateway.
 */
contract GatewayBase is Organized {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    /**
     * Emitted whenever a Gateway/CoGateway contract is proven.
     * wasAlreadyProved parameter differentiates between first call and replay
     * call of proveGateway method for same block height.
     */
    event GatewayProven(
        address _gateway,
        uint256 _blockHeight,
        bytes32 _storageRoot,
        bool _wasAlreadyProved
    );

    event BountyChangeInitiated(
        uint256 _currentBounty,
        uint256 _proposedBounty,
        uint256 _unlockHeight
    );

    event BountyChangeConfirmed(
        uint256 _currentBounty,
        uint256 _changedBounty
    );


    /* Constants */

    /** Position of message bus in the storage. */
    uint8 constant MESSAGE_BOX_OFFSET = 7;

    /**
     * Penalty in bounty amount percentage charged to staker on revert stake.
     */
    uint8 constant REVOCATION_PENALTY = 150;

    //todo identify how to get block time for both chains
    /** Unlock period for change bounty in block height. */
    uint256 private constant BOUNTY_CHANGE_UNLOCK_PERIOD = 100;


    /* Public Variables */

    /**
     *  Address of contract which implements StateRootInterface.
     */
    StateRootInterface public stateRootProvider;

    /** Path to make Merkle account proof for Gateway/CoGateway contract. */
    bytes public encodedGatewayPath;

    /**
     * Remote gateway contract address. If this is a gateway contract, then the
     * remote gateway is a CoGateway and vice versa.
     */
    address public remoteGateway;

    /** Amount of ERC20 which is staked by facilitator. */
    uint256 public bounty;

    /** Proposed new bounty amount for bounty change. */
    uint256 public proposedBounty;

    /** Bounty proposal block height. */
    uint256 public proposedBountyUnlockHeight;


    /* Internal Variables */

    /**
     * Message box.
     * @dev Keep this is at location 1, in case this is changed then update
     *      constant MESSAGE_BOX_OFFSET accordingly.
     */
    MessageBus.MessageBox internal messageBox;

    /** Maps messageHash to the Message object. */
    mapping(bytes32 => MessageBus.Message) public messages;

    /** Maps blockHeight to storageRoot. */
    mapping(uint256 => bytes32) internal storageRoots;


    /* Private Variables */

    /**
     * Maps address to message hash.
     *
     * Once the inbox process is started the corresponding
     * message hash is stored against the address starting process.
     * This is used to restrict simultaneous/multiple process
     * for a particular address. This is also used to determine the
     * nonce of the particular address. Refer getNonce for the details.
     */
    mapping(address => bytes32) private inboxActiveProcess;

    /**
     * Maps address to message hash.
     *
     * Once the outbox process is started the corresponding
     * message hash is stored  against the address starting process.
     * This is used to restrict simultaneous/multiple process
     * for a particular address. This is also used to determine the
     * nonce of the particular address. Refer getNonce for the details.
     */
    mapping(address => bytes32) private outboxActiveProcess;


    /* Constructor */

    /**
     * @notice Initialize the contract and set default values.
     *
     * @param _stateRootProvider Contract address which implements
     *                           StateRootInterface.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                message transfers.
     * @param _organization Address of an organization contract.
     */
    constructor(
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        OrganizationInterface _organization
    )
        Organized(_organization)
        public
    {
        require(
            address(_stateRootProvider) != address(0),
            "State root provider contract address must not be zero."
        );

        stateRootProvider = _stateRootProvider;

        bounty = _bounty;
    }


    /* External Functions */

    /**
     *  @notice This can be called by anyone to verify merkle proof of
     *          gateway/co-gateway contract address. Trust factor is brought by
     *          state roots of the contract which implements StateRootInterface.
     *          It's important to note that in replay calls of proveGateway
     *          bytes _rlpParentNodes variable is not validated. In this case
     *          input storage root derived from merkle proof account nodes is
     *          verified with stored storage root of given blockHeight.
     *          GatewayProven event has parameter wasAlreadyProved to
     *          differentiate between first call and replay calls.
     *
     *  @param _blockHeight Block height at which Gateway/CoGateway is to be
     *                      proven.
     *  @param _rlpAccount RLP encoded account node object.
     *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
     *
     *  @return `true` if Gateway account is proved
     */
    function proveGateway(
        uint256 _blockHeight,
        bytes calldata _rlpAccount,
        bytes calldata _rlpParentNodes
    )
        external
        returns (bool /* success */)
    {
        // _rlpAccount should be valid
        require(
            _rlpAccount.length != 0,
            "Length of RLP account must not be 0."
        );

        // _rlpParentNodes should be valid
        require(
            _rlpParentNodes.length != 0,
            "Length of RLP parent nodes is 0"
        );

        bytes32 stateRoot = stateRootProvider.getStateRoot(_blockHeight);

        // State root should be present for the block height
        require(
            stateRoot != bytes32(0),
            "State root must not be zero"
        );

        // If account already proven for block height
        bytes32 provenStorageRoot = storageRoots[_blockHeight];

        if (provenStorageRoot != bytes32(0)) {

            // wasAlreadyProved is true here since proveOpenST is replay call
            // for same block height
            emit GatewayProven(
                remoteGateway,
                _blockHeight,
                provenStorageRoot,
                true
            );

            // return true
            return true;
        }

        bytes32 storageRoot = GatewayLib.proveAccount(
            _rlpAccount,
            _rlpParentNodes,
            encodedGatewayPath,
            stateRoot
        );

        storageRoots[_blockHeight] = storageRoot;

        // wasAlreadyProved is false since Gateway is called for the first time
        // for a block height
        emit GatewayProven(
            remoteGateway,
            _blockHeight,
            storageRoot,
            false
        );

        return true;
    }

    /**
     * @notice Get the nonce for the given account address
     *
     * @param _account Account address for which the nonce is to fetched
     *
     * @return nonce
     */
    function getNonce(address _account)
        external
        view
        returns (uint256)
    {
        // call the private method
        return _getOutboxNonce(_account);
    }

    /**
     * @notice Method allows organization to propose new bounty amount.
     *
     * @param _proposedBounty proposed bounty amount.
     *
     * @return uint256 proposed bounty amount.
     */
    function initiateBountyAmountChange(uint256 _proposedBounty)
        external
        onlyOrganization
        returns(uint256)
    {
        proposedBounty = _proposedBounty;
        proposedBountyUnlockHeight = block.number.add(BOUNTY_CHANGE_UNLOCK_PERIOD);

        emit BountyChangeInitiated(
                bounty,
                _proposedBounty,
                proposedBountyUnlockHeight
        );

        return _proposedBounty;
    }

    /**
     * @notice Method allows organization to confirm proposed bounty amount
     *         after unlock period.
     *
     * @return changedBountyAmount_  updated bounty amount.
     * @return previousBountyAmount_ previous bounty amount.
     */
    function confirmBountyAmountChange()
        external
        onlyOrganization
        returns (
            uint256 changedBountyAmount_,
            uint256 previousBountyAmount_
        )
    {
        require(
            proposedBounty != bounty,
            "Proposed bounty should be different from existing bounty."
        );
        require(
            proposedBountyUnlockHeight < block.number,
            "Confirm bounty amount change can only be done after unlock period."
        );

        changedBountyAmount_ = proposedBounty;
        previousBountyAmount_ = bounty;

        bounty = proposedBounty;

        proposedBounty = 0;
        proposedBountyUnlockHeight = 0;

        emit BountyChangeConfirmed(previousBountyAmount_, changedBountyAmount_);
    }

    /**
     * @notice Method to get the outbox message status for the given message
     *         hash. If message hash does not exist then it will return
     *         undeclared status.
     *
     * @param _messageHash Message hash to get the status.
     *
     * @return status_ Message status.
     */
    function getOutboxMessageStatus(
        bytes32 _messageHash
    )
        external
        view
        returns (MessageBus.MessageStatus status_)
    {
        status_ = messageBox.outbox[_messageHash];
    }

    /**
     * @notice Method to get the inbox message status for the given message
     *         hash. If message hash does not exist then it will return
     *         undeclared status.
     *
     * @param _messageHash Message hash to get the status.
     *
     * @return status_ Message status.
     */
    function getInboxMessageStatus(
        bytes32 _messageHash
    )
        external
        view
        returns (MessageBus.MessageStatus status_)
    {
        status_ = messageBox.inbox[_messageHash];
    }

    /**
     * @notice Method to get the active message hash and its status from inbox
     *         for the given account address. If message hash does not exist
     *         for the given account address then it will return zero hash and
     *         undeclared status.
     *
     * @param _account Account address.
     *
     * @return messageHash_ Message hash.
     * @return status_ Message status.
     */
    function getInboxActiveProcess(
        address _account
    )
        external
        view
        returns (
            bytes32 messageHash_,
            MessageBus.MessageStatus status_
        )
    {
        messageHash_ = inboxActiveProcess[_account];
        status_ = messageBox.inbox[messageHash_];
    }

    /**
     * @notice Method to get the active message hash and its status from outbox
     *         for the given account address. If message hash does not exist
     *         for the given account address then it will return zero hash and
     *         undeclared status.
     *
     * @param _account Account address.
     *
     * @return messageHash_ Message hash.
     * @return status_ Message status.
     */
    function getOutboxActiveProcess(
        address _account
    )
        external
        view
        returns (
            bytes32 messageHash_,
            MessageBus.MessageStatus status_
        )
    {
        messageHash_ = outboxActiveProcess[_account];
        status_ = messageBox.outbox[messageHash_];
    }


    /* Internal Functions */

    /**
     * @notice Calculate the fee amount which is rewarded to facilitator for
     *         performing message transfers.
     *
     * @param _gasConsumed Gas consumption during message confirmation.
     * @param _gasLimit Maximum amount of gas can be used for reward.
     * @param _gasPrice Gas price at which reward is calculated.
     * @param _initialGas Initial gas at the start of the process.
     *
     * @return fee_ Fee amount.
     * @return totalGasConsumed_ Total gas consumed during message transfer.
     */
    function feeAmount(
        uint256 _gasConsumed,
        uint256 _gasLimit,
        uint256 _gasPrice,
        uint256 _initialGas
    )
        internal
        view
        returns (
            uint256 fee_,
            uint256 totalGasConsumed_
        )
    {
        totalGasConsumed_ = _initialGas.add(
            _gasConsumed
        ).sub(
            gasleft()
        );

        if (totalGasConsumed_ < _gasLimit) {
            fee_ = totalGasConsumed_.mul(_gasPrice);
        } else {
            fee_ = _gasLimit.mul(_gasPrice);
        }
    }

    /**
     * @notice Create and return Message object.
     *
     * @dev This function is to avoid stack too deep error.
     *
     * @param _intentHash Intent hash
     * @param _accountNonce Nonce for the account address
     * @param _gasPrice Gas price
     * @param _gasLimit Gas limit
     * @param _account Account address
     * @param _hashLock Hash lock
     *
     * @return Message object
     */
    function getMessage(
        bytes32 _intentHash,
        uint256 _accountNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _account,
        bytes32 _hashLock
    )
        internal
        pure
        returns (MessageBus.Message memory)
    {
        return MessageBus.Message({
            intentHash : _intentHash,
            nonce : _accountNonce,
            gasPrice : _gasPrice,
            gasLimit : _gasLimit,
            sender : _account,
            hashLock : _hashLock,
            gasConsumed : 0
        });
    }

    /**
     * @notice Internal function to get the outbox nonce for the given account
     *         address
     *
     * @param _account Account address for which the nonce is to fetched
     *
     * @return nonce
     */
    function _getOutboxNonce(address _account)
        internal
        view
        returns (uint256 /* nonce */)
    {

        bytes32 previousProcessMessageHash = outboxActiveProcess[_account];
        return getMessageNonce(previousProcessMessageHash);
    }

    /**
     * @notice Internal function to get the inbox nonce for the given account
     *         address.
     *
     * @param _account Account address for which the nonce is to fetched
     *
     * @return nonce
     */
    function _getInboxNonce(address _account)
        internal
        view
        returns (uint256 /* nonce */)
    {

        bytes32 previousProcessMessageHash = inboxActiveProcess[_account];
        return getMessageNonce(previousProcessMessageHash);
    }

    /**
     * @notice Stores a message at its hash in the messages mapping.
     *
     * @param _message The message to store.
     *
     * @return messageHash_ The hash that represents the given message.
     */
    function storeMessage(
        MessageBus.Message memory _message
    )
        internal
        returns (bytes32 messageHash_)
    {
        messageHash_ = MessageBus.messageDigest(
            _message.intentHash,
            _message.nonce,
            _message.gasPrice,
            _message.gasLimit,
            _message.sender,
            _message.hashLock
        );

        messages[messageHash_] = _message;
    }

    /**
     * @notice Clears the previous outbox process. Validates the
     *         nonce. Updates the process with new process
     *
     * @param _account Account address
     * @param _nonce Nonce for the account address
     * @param _messageHash Message hash
     */
    function registerOutboxProcess(
        address _account,
        uint256 _nonce,
        bytes32 _messageHash

    )
        internal
    {
        require(
            _nonce == _getOutboxNonce(_account),
            "Invalid nonce."
        );

        bytes32 previousMessageHash = outboxActiveProcess[_account];

        if (previousMessageHash != bytes32(0)) {

            MessageBus.MessageStatus status =
                messageBox.outbox[previousMessageHash];

            require(
                status == MessageBus.MessageStatus.Progressed ||
                status == MessageBus.MessageStatus.Revoked,
                "Previous process is not completed."
            );

            delete messages[previousMessageHash];
        }

        // Update the active process.
        outboxActiveProcess[_account] = _messageHash;

    }

    /**
     * @notice Clears the previous outbox process. Validates the
     *         nonce. Updates the process with new process.
     *
     * @param _account Account address.
     * @param _nonce Nonce for the account address.
     * @param _messageHash Message hash.
     */
    function registerInboxProcess(
        address _account,
        uint256 _nonce,
        bytes32 _messageHash
    )
        internal
    {
        require(
            _nonce == _getInboxNonce(_account),
            "Invalid nonce"
        );

        bytes32 previousMessageHash = inboxActiveProcess[_account];

        if (previousMessageHash != bytes32(0)) {

            MessageBus.MessageStatus status =
                messageBox.inbox[previousMessageHash];

            require(
                status == MessageBus.MessageStatus.Progressed ||
                status == MessageBus.MessageStatus.Revoked,
                "Previous process is not completed"
            );

            delete messages[previousMessageHash];
        }

        // Update the active process.
        inboxActiveProcess[_account] = _messageHash;
    }

    /**
     * @notice Calculates the penalty amount for reverting a message transfer.
     *
     * @param _bounty The amount that facilitator has staked to initiate the
     *                message transfers.
     *
     * @return penalty_ Amount of penalty needs to be paid by message initiator
     *                  to revert message transfers.
     */
    function penaltyFromBounty(uint256 _bounty)
        internal
        pure
        returns(uint256 penalty_)
    {
        penalty_ = _bounty.mul(REVOCATION_PENALTY).div(100);
    }

    /* Private Functions */

    /**
     * @notice Returns the next nonce of inbox or outbox process
     *
     * @param _messageHash Message hash
     *
     * @return _nonce nonce of next inbox or outbox process
     */
    function getMessageNonce(bytes32 _messageHash)
        private
        view
        returns(uint256)
    {
        if (_messageHash == bytes32(0)) {
            return 1;
        }

        MessageBus.Message storage message =
        messages[_messageHash];

        return message.nonce.add(1);
    }
}

