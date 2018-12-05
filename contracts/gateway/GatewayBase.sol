pragma solidity ^0.5.0;

import "../lib/GatewayLib.sol";
import "./CoreInterface.sol";
import "../lib/SafeMath.sol";
import "./MessageBus.sol";
import "../StateRootInterface.sol";
import "./EIP20Interface.sol";


/**
 *  @title GatewayBase contract.
 *
 *  @notice GatewayBase contains general purpose functions shared between
 *  gateway and co-gateway contract.
 */
contract GatewayBase {

    using SafeMath for uint256;
    /**
     * Emitted whenever a Gateway/CoGateway contract is proven.
     * wasAlreadyProved parameter differentiates between first call and replay
     * call of proveGateway method for same block height
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

    bytes32 constant STAKE_TYPEHASH = keccak256(
        abi.encode(
            "Stake(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );

    bytes32 constant REDEEM_TYPEHASH = keccak256(
        abi.encode(
            "Redeem(uint256 amount,address beneficiary,MessageBus.Message message)"
        )
    );

    /* constants */

    /** Position of message bus in the storage */
    uint8 constant MESSAGE_BOX_OFFSET = 1;

    /**
     * Penalty in bounty amount percentage charged to staker on revert stake
     */
    uint8 constant REVOCATION_PENALTY = 150;

    //todo identify how to get block time for both chains
    /** Unlock period for change bounty in block height */
    uint256 private constant BOUNTY_CHANGE_UNLOCK_PERIOD = 100;

    /**
     * Message box.
     * @dev keep this is at location 1, in case this is changed then update
     *      constant MESSAGE_BOX_OFFSET accordingly.
     */
    MessageBus.MessageBox messageBox;

    /** Organisation address. */
    address public organisation;

    /** address of core contract. */
    CoreInterface public core;

    /** path to prove merkle account proof for Gateway/CoGateway contract. */
    bytes internal encodedGatewayPath;

    /**
     * Remote gateway contract address. If gateway contract remote gateway
     * is CoGateway and vice versa.
     */
    address public remoteGateway;

    /** amount of ERC20 which is staked by facilitator. */
    uint256 public bounty;

    /** Proposed new bounty amount for bounty change. */
    uint256 public proposedBounty;
    /** bounty proposal block height*/
    uint256 public proposedBountyUnlockHeight;

    /** Maps messageHash to the Message object. */
    mapping(bytes32 /*messageHash*/ => MessageBus.Message) messages;

    /** Mapping to store blockHeight to storageRoot. */
    mapping(uint256 /* block height */ => bytes32 /* storageRoot */) internal storageRoots;

    /**
     * Maps address to message hash.
     *
     * Once the inbox process is started the corresponding
     * message hash is stored against the address starting process.
     * This is used to restrict simultaneous/multiple process
     * for a particular address. This is also used to determine the
     * nonce of the particular address. Refer getNonce for the details.
     */
    mapping(address /*address*/ => bytes32 /*messageHash*/) inboxActiveProcess;

    /**
     * Maps address to message hash.
     *
     * Once the outbox process is started the corresponding
     * message hash is stored  against the address starting process.
     * This is used to restrict simultaneous/multiple process
     * for a particular address. This is also used to determine the
     * nonce of the particular address. Refer getNonce for the details.
     */
    mapping(address /*address*/ => bytes32 /*messageHash*/) outboxActiveProcess;

    /* modifiers */

    /** checks that only organisation can call a particular function. */
    modifier onlyOrganisation() {
        require(
            msg.sender == organisation,
            "Only organisation can call the function."
        );
        _;
    }

    /* Constructor */

    /**
     * @notice Initialise the contract and set default values.
     *
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                stake process.
     * @param _organisation Organisation address.
     */
    constructor(
        CoreInterface _core,
        uint256 _bounty,
        address _organisation
    )
        public
    {
        require(
            address(_core) != address(0),
            "Core contract address must not be zero."
        );
        require(
            _organisation != address(0),
            "Organisation address must not be zero."
        );

        core = _core;

        bounty = _bounty;
        organisation = _organisation;

    }

    /* external functions */

    /**
     *  @notice External function prove gateway/co-gateway.
     *
     *  @dev proveGateway can be called by anyone to verify merkle proof of
     *       gateway/co-gateway contract address. Trust factor is brought by
     *       stateRoots mapping. stateRoot is committed in commitStateRoot
     *       function by mosaic process which is a trusted decentralized system
     *       running separately. It's important to note that in replay calls of
     *       proveGateway bytes _rlpParentNodes variable is not validated. In
     *       this case input storage root derived from merkle proof account
     *       nodes is verified with stored storage root of given blockHeight.
     *       GatewayProven event has parameter wasAlreadyProved to
     *       differentiate between first call and replay calls.
     *
     *  @param _blockHeight Block height at which Gateway/CoGateway is to be
     *                      proven.
     *  @param _rlpEncodedAccount RLP encoded account node object.
     *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
     *
     *  @return `true` if Gateway account is proved
     */
    function proveGateway(
        uint256 _blockHeight,
        bytes calldata _rlpEncodedAccount,
        bytes calldata _rlpParentNodes
    )
        external
        returns (bool /* success */)
    {
        // _rlpEncodedAccount should be valid
        require(
            _rlpEncodedAccount.length != 0,
            "Length of RLP encoded account is 0"
        );

        // _rlpParentNodes should be valid
        require(
            _rlpParentNodes.length != 0,
            "Length of RLP parent nodes is 0"
        );

        bytes32 stateRoot = StateRootInterface(address(core)).getStateRoot(_blockHeight);

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
            _rlpEncodedAccount,
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
        onlyOrganisation()
        external
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
        onlyOrganisation()
        external
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
     * @notice Create and return Message object.
     *
     * @dev This function is to avoid stack too deep error.
     *
     * @param _account Account address
     * @param _accountNonce Nonce for the account address
     * @param _gasPrice Gas price
     * @param _gasLimit Gas limit
     * @param _intentHash Intent hash
     * @param _hashLock Hash lock
     *
     * @return Message object
     */
    function getMessage(
        address _account,
        uint256 _accountNonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        bytes32 _intentHash,
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
     * @notice Clears the previous outbox process. Validates the
     *         nonce. Updates the process with new process
     *
     * @param _account Account address
     * @param _nonce Nonce for the account address
     * @param _messageHash Message hash
     *
     * @return previousMessageHash_ previous messageHash
     */
    function registerOutboxProcess(
        address _account,
        uint256 _nonce,
        bytes32 _messageHash

    )
        internal
        returns (bytes32 previousMessageHash_)
    {
        require(
            _nonce == _getOutboxNonce(_account),
            "Invalid nonce"
        );

        previousMessageHash_ = outboxActiveProcess[_account];

        if (previousMessageHash_ != bytes32(0)) {

            MessageBus.MessageStatus status =
            messageBox.outbox[previousMessageHash_];

            require(
                status == MessageBus.MessageStatus.Progressed ||
                status == MessageBus.MessageStatus.Revoked,
                "Previous process is not completed"
            );

            delete messages[previousMessageHash_];
        }

        // Update the active proccess.
        outboxActiveProcess[_account] = _messageHash;

    }


    /**
     * @notice Clears the previous outbox process. Validates the
     *         nonce. Updates the process with new process
     *
     * @param _account Account address
     * @param _nonce Nonce for the account address
     * @param _messageHash Message hash
     *
     * @return previousMessageHash_ previous messageHash
     */
    function registerInboxProcess(
        address _account,
        uint256 _nonce,
        bytes32 _messageHash
    )
        internal
        returns (bytes32 previousMessageHash_)
    {
        require(
            _nonce == _getInboxNonce(_account),
            "Invalid nonce"
        );

        previousMessageHash_ = inboxActiveProcess[_account];

        if (previousMessageHash_ != bytes32(0)) {

            MessageBus.MessageStatus status =
            messageBox.inbox[previousMessageHash_];

            require(
                status == MessageBus.MessageStatus.Progressed ||
                status == MessageBus.MessageStatus.Revoked,
                "Previous process is not completed"
            );

            delete messages[previousMessageHash_];
        }

        // Update the active proccess.
        inboxActiveProcess[_account] = _messageHash;
    }

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

