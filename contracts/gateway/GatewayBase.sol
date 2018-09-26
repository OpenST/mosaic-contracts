pragma solidity ^0.4.23;

import './GatewayLib.sol';
import "./CoreInterface.sol";
import "./SafeMath.sol";
import "./MessageBus.sol";

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
    bytes32 constant GATEWAY_LINK_TYPEHASH = keccak256(
        abi.encode(
            "GatewayLink(bytes32 messageHash,MessageBus.Message message)"
        )
    );

    /* constants */

    /** Position of message bus in the storage */
    uint8 constant MESSAGE_BOX_OFFSET = 1;

    /**
     * Penalty in bounty amount percentage charged to staker on revert staking
     */
    uint8 constant REVOCATION_PENALTY = 150;

    /** Specifies if the Gateway and CoGateway contracts are linked. */
    bool public linked;

    /**
     * Message box.
     * @dev keep this is at location 1, in case this is changed then update
     *      constant MESSAGE_BOX_OFFSET accordingly.
     */
    MessageBus.MessageBox messageBox;

    /** Specifies if the Gateway is deactivated for any new staking process. */
    bool public deactivated;

    /** Organisation address. */
    address public organisation;

    /** amount of ERC20 which is staked by facilitator. */
    uint256 public bounty;

    /** address of core contract. */
    CoreInterface public core;

    /** path to prove merkle account proof for Gateway/CoGateway contract. */
    bytes internal encodedGatewayPath;

    /** Remote gateway contract address. */
    address public remoteGateway;

    /** Gateway link message hash. */
    bytes32 public gatewayLinkHash;

    /** Maps messageHash to the Message object. */
    mapping(bytes32 /*messageHash*/ => MessageBus.Message) messages;

    /** Maps blockHeight to storageRoot*/
    mapping(uint256 /* block height */ => bytes32) internal storageRoots;

    /**
     * Maps address to message hash.
     *
     * Once the inbox process is started the corresponding
     * message hash is stored  against the address starting process.
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

    /* internal variables */

    /** address of message bus used to fetch codehash during gateway linking */
    address internal messageBus;

    /* modifiers */

    /** checks that only organisation can call a particular function. */
    modifier onlyOrganisation() {
        require(
            msg.sender == organisation,
            "Only organisation can call the function"
        );
        _;
    }

    /** checks that contract is linked and is not deactivated */
    modifier isActive() {
        require(
            deactivated == false && linked == true,
            "Contract is restricted to use"
        );
        _;
    }

    constructor(
        CoreInterface _core,
        address _messageBus,
        uint256 _bounty,
        address _organisation
    )
    public
    {
        require(
            _core != address(0),
            "Core contract address must not be zero"
        );
        require(
            _organisation != address(0),
            "Organisation address must not be zero"
        );
        require(
            _messageBus != address(0),
            "MessageBus address must not be zero"
        );

        core = _core;
        messageBus = _messageBus;

        //gateway and cogateway is not linked yet so it is initialized as false
        linked = false;

        // gateway is active
        deactivated = false;
        bounty = _bounty;
        organisation = _organisation;

    }

    /* external functions */

    /**
 *  @notice External function prove gateway/co-gateway.
 *
 *  @dev proveGateway can be called by anyone to verify merkle proof of
 *       gateway/co-gateway contract address. Trust factor is brought by stateRoots
 *       mapping. stateRoot is committed in commitStateRoot function by
 *       mosaic process which is a trusted decentralized system running
 *       separately. It's important to note that in replay calls of
 *       proveGateway bytes _rlpParentNodes variable is not validated. In
 *       this case input storage root derived from merkle proof account
 *       nodes is verified with stored storage root of given blockHeight.
 *		 GatewayProven event has parameter wasAlreadyProved to
 *       differentiate between first call and replay calls.
 *
 *  @param _blockHeight Block height at which Gateway/CoGateway is to be proven.
 *  @param _rlpEncodedAccount RLP encoded account node object.
 *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
 *
 *  @return `true` if Gateway account is proved
 */
    function proveGateway(
        uint256 _blockHeight,
        bytes _rlpEncodedAccount,
        bytes _rlpParentNodes
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

        bytes32 stateRoot = core.getStateRoot(_blockHeight);

        // State root should be present for the block height
        require(
            stateRoot != bytes32(0),
            "State root must not be zero"
        );

        // If account already proven for block height
        bytes32 provenStorageRoot = storageRoots[_blockHeight];

        if (provenStorageRoot != bytes32(0)) {

            // Check extracted storage root is matching with existing stored
            // storage root
            require(
                provenStorageRoot == storageRoot,
                "Storage root mismatch when account is already proven"
            );

            // wasAlreadyProved is true here since proveOpenST is replay call
            // for same block height
            emit GatewayProven(
                remoteGateway,
                _blockHeight,
                storageRoot,
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
     * @notice Activate Gateway contract. Can be set only by the
     *         Organisation address
     *
     * @return `true` if value is set
     */
    function activateGateway()
        external
        onlyOrganisation
        returns (bool)
    {
        require(
            deactivated == true,
            "Gateway is already active"
        );
        deactivated = false;
        return true;
    }

    /**
     * @notice Deactivate Gateway contract. Can be set only by the
     *         Organisation address
     *
     * @return `true` if value is set
     */
    function deactivateGateway()
        external
        onlyOrganisation
        returns (bool)
    {
        require(
            deactivated == false,
            "Gateway is already deactivated"
        );
        deactivated = true;
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
        returns (uint256 /* nonce */)
    {
        // call the private method
        return _getNonce(_account);
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
        returns (MessageBus.Message)
    {
        return MessageBus.Message(
            {
            intentHash : _intentHash,
            nonce : _accountNonce,
            gasPrice : _gasPrice,
            gasLimit : _gasLimit,
            sender : _account,
            hashLock : _hashLock,
            gasConsumed : 0
            }
        );
    }

    /**
     * @notice Private function to get the nonce for the given account address
     *
     * @param _account Account address for which the nonce is to fetched
     *
     * @return nonce
     */
    function _getNonce(address _account)
        internal
        view
        returns (uint256 /* nonce */)
    {

        bytes32 previousProcessMessageHash = outboxActiveProcess[_account];

        if (previousProcessMessageHash == bytes32(0)) {
            return 1;
        }

        MessageBus.Message storage message =
        messages[previousProcessMessageHash];

        return message.nonce.add(1);
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
            _nonce == _getNonce(_account),
            "Invalid nonce"
        );

        previousMessageHash_ = outboxActiveProcess[_account];

        if (previousMessageHash_ != bytes32(0)) {

            MessageBus.MessageStatus status =
            messageBox.outbox[previousMessageHash_];

            require(
                status != MessageBus.MessageStatus.Progressed ||
                status != MessageBus.MessageStatus.Revoked,
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
            _nonce == _getNonce(_account),
            "Invalid nonce"
        );

        previousMessageHash_ = inboxActiveProcess[_account];

        if (previousMessageHash_ != bytes32(0)) {

            MessageBus.MessageStatus status =
            messageBox.inbox[previousMessageHash_];

            require(
                status != MessageBus.MessageStatus.Progressed ||
                status != MessageBus.MessageStatus.Revoked,
                "Previous process is not completed"
            );

            delete messages[previousMessageHash_];
        }

        // Update the active proccess.
        inboxActiveProcess[_account] = _messageHash;
    }
}

