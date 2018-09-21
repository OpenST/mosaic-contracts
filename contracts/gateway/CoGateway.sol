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
//
// ----------------------------------------------------------------------------
// Auxiliary Chain: CoGateway Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./MessageBus.sol";
import "./Hasher.sol";
import "./EIP20Interface.sol";
import "./SafeMath.sol";
import "./GatewayBase.sol";
import "./CoreInterface.sol";
import "./UtilityTokenInterface.sol";
import "./ProtocolVersioned.sol";
import "./GatewayLib.sol";

/**
 *  @title CoGatewaySetup contract.
 *
 *  @notice CoGatewaySetup contains functions for initial setup of co-gateway.
 */
contract CoGateway is Hasher, GatewayBase {

    using SafeMath for uint256;

    /** Emitted whenever a gateway and coGateway linking is confirmed. */
    event GatewayLinkConfirmed(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _valueToken,
        address _utilityToken
    );

    /** Emitted whenever a gateway and coGateway linking is complete. */
    event GatewayLinkProgressed(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _valueToken,
        address _utilityToken,
        bytes32 _unlockSecret
    );

    /**
     * ActiveProcess stores the information related to in progress process
     * like stake/mint unstake/redeem.
     */
    struct ActiveProcess {

        /** latest message hash. */
        bytes32 messageHash;

        /** Outbox or Inbox process. */
        MessageBus.MessageBoxType messageBoxType;
    }

    /* constants */

    uint8 MESSAGE_BOX_OFFSET = 1;

    /* public variables */

    /**
     * Message box.
     * @dev keep this is at location 1, in case this is changed then update
     *      constant OUTBOX_OFFSET accordingly.
     */
    MessageBus.MessageBox messageBox;

    /** Specifies if the Gateway and CoGateway contracts are linked. */
    bool public linked;

    /** Specifies if the CoGateway is deactivated for any new redeem process.*/
    bool public deactivated;

    /** Organisation address. */
    address public organisation;

    /** amount of base token which is staked by facilitator. */
    uint256 public bounty;

    /** address of utility token. */
    address public utilityToken;

    /** address of value token. */
    address public valueToken;

    /** Gateway link message hash. */
    bytes32 public gatewayLinkHash;

    /** Maps messageHash to the Message object. */
    mapping(bytes32 /*messageHash*/ => MessageBus.Message) messages;

    /**
     * Maps address to ActiveProcess object.
     *
     * Once the minting or redeem process is started the corresponding
     * message hash is stored in ActiveProcess against the staker/redeemer
     * address. This is used to restrict simultaneous/multiple minting and
     * redeem for a particular address. This is also used to determine the
     * nonce of the particular address. Refer getNonce for the details.
     */
    mapping(address /*address*/ => ActiveProcess) activeProcess;

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

    /* Constructor */

    /**
     * @notice Initialise the contract by providing the Gateway contract
     *         address for which the CoGateway will enable facilitation of
     *         minting and redeeming.
     *
     * @param _valueToken The value token contract address.
     * @param _utilityToken The utility token address that will be used for
     *                      minting the utility token.
     * @param _core Core contract address.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                staking process.
     * @param _organisation Organisation address.
     * @param _gateway Gateway contract address.
     */
    constructor(
        address _valueToken,
        address _utilityToken,
        CoreInterface _core,
        uint256 _bounty,
        address _organisation,
        address _gateway,
        address _messageBus
    )
    GatewayBase(_core)
    public
    {
        require(
            _valueToken != address(0),
            "Value token address must not be zero"
        );
        require(
            _utilityToken != address(0),
            "Utility token address must not be zero"
        );
        require(
            _core != address(0),
            "Core contract address must not be zero"
        );
        require(
            _organisation != address(0),
            "Organisation address must not be zero"
        );
        require(
            _gateway != address(0),
            "Gateway address must not be zero"
        );
        require(
            _messageBus != address(0),
            "MessageBus address must not be zero"
        );

        //gateway and cogateway is not linked yet so it is initialized as false
        linked = false;

        // gateway is active
        deactivated = false;

        valueToken = _valueToken;
        utilityToken = _utilityToken;
        core = _core;
        bounty = _bounty;
        organisation = _organisation;
        messageBus = _messageBus;
        gateway = _gateway;

        // update the encodedGatewayPath
        encodedGatewayPath = GatewayLib.bytes32ToBytes(
            keccak256(abi.encodePacked(_gateway))
        );
    }

    /* External functions */

    /**
     * @notice Confirm the Gateway and CoGateway contracts initiation.
     *
     * @param _intentHash Gateway and CoGateway linking intent hash.
     *                    This is a sha3 of gateway address, cogateway address,
     *                    bounty, token name, token symbol, token decimals,
     *                    _nonce, token.
     * @param _nonce Nonce of the sender. Here in this case its organisation
     *               address of Gateway
     * @param _sender The address that signs the message hash. In this case it
     *                has to be organisation address of Gateway
     * @param _hashLock Hash lock, set by the facilitator.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox of Gateway
     *
     * @return messageHash_ Message hash
     */
    function confirmGatewayLinkIntent(
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes memory _rlpParentNodes
    )
    public // TODO: check to change it to external, getting stack to deep.
    returns (bytes32 messageHash_)
    {
        require(
            linked == false,
            "CoGateway contract must not be already linked"
        );
        require(
            deactivated == false,
            "Gateway contract must not be deactivated"
        );
        require(
            gatewayLinkHash == bytes32(0),
            "Linking is already initiated"
        );
        require(
            _sender != address(0),
            "Sender must be not be zero"
        );
        require(
            _nonce == _getNonce(_sender),
            "Sender nonce must be in sync"
        );
        require(
            _hashLock != bytes32(0),
            "Hash lock must not be zero"
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero"
        );

        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root for given block height must not be zero"
        );

        bytes32 intentHash = hashLinkGateway(_nonce);

        // Ensure that the _intentHash matches the calculated intentHash
        require(
            intentHash == _intentHash,
            "Incorrect intent hash"
        );

        // Get the message hash
        messageHash_ = MessageBus.messageDigest(
            GATEWAY_LINK_TYPEHASH,
            intentHash,
            _nonce,
            0,
            0
        );
        // create Message object
        messages[messageHash_] = getMessage(
            _sender,
            _nonce,
            0,
            0,
            _intentHash,
            _hashLock
        );

        // initiate new inbox process
        initiateNewProcess(
            _sender,
            _nonce,
            messageHash_,
            MessageBus.MessageBoxType.Inbox
        );

        // Declare message in inbox
        MessageBus.confirmMessage(
            messageBox,
            GATEWAY_LINK_TYPEHASH,
            messages[messageHash_],
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot
        );

        gatewayLinkHash = messageHash_;

        // Emit GatewayLinkConfirmed event
        emit GatewayLinkConfirmed(
            messageHash_,
            gateway,
            address(this),
            valueToken,
            utilityToken
        );
    }

    /**
     * @notice Complete the Gateway and CoGateway contracts linking. This will
     *         set the variable linked to true, and thus it will activate the
     *         CoGateway contract for mint and redeem.
     *
     * @param _messageHash Message hash
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      facilitator while initiating the Gateway/CoGateway
     *                      linking
     *
     * @return `true` if gateway linking was successfully progressed
     */
    function progressGatewayLink(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
    external
    returns (bool)
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero"
        );
        require(
            _unlockSecret != bytes32(0),
            "Unlock secret must not be zero"
        );
        require(
            gatewayLinkHash == _messageHash,
            "Invalid message hash"
        );

        // Progress inbox
        MessageBus.progressInbox(
            messageBox,
            GATEWAY_LINK_TYPEHASH,
            messages[_messageHash],
            _unlockSecret
        );

        // Update to specify the Gateway/CoGateway is linked
        linked = true;

        // Emit GatewayLinkProgressed event
        emit GatewayLinkProgressed(
            _messageHash,
            gateway,
            address(this),
            valueToken,
            utilityToken,
            _unlockSecret
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
    returns (uint256 /* nonce */)
    {
        // call the private method
        return _getNonce(_account);
    }
    /* internal methods */

    /**
     * @notice Clears the previous process. Validates the
     *         nonce. Updates the process with new process
     *
     * @param _account Account address
     * @param _nonce Nonce for the account address
     * @param _messageHash Message hash
     * @param _messageBoxType message box type i.e Inbox or Outbox
     *
     * @return previousMessageHash_ previous messageHash
     */
    function initiateNewProcess(
        address _account,
        uint256 _nonce,
        bytes32 _messageHash,
        MessageBus.MessageBoxType _messageBoxType
    )
    internal
    returns (bytes32 previousMessageHash_)
    {
        require(
            _nonce == _getNonce(_account),
            "Invalid nonce"
        );

        ActiveProcess storage previousProcess = activeProcess[_account];
        previousMessageHash_ = previousProcess.messageHash;

        if (previousMessageHash_ != bytes32(0)) {

            MessageBus.MessageStatus status;
            if (previousProcess.messageBoxType ==
                MessageBus.MessageBoxType.Inbox) {
                status = messageBox.inbox[previousMessageHash_];
            } else {
                status = messageBox.outbox[previousMessageHash_];
            }
            require(
                status != MessageBus.MessageStatus.Progressed ||
                status != MessageBus.MessageStatus.Revoked,
                "Previous process is not completed"
            );
            //TODO: Commenting below line. Please check if deleting this will
            //      effect any process related to merkle proof in other chain.
            //delete messageBox.outbox[previousMessageHash_];

            delete messages[previousMessageHash_];
        }

        // Update the active proccess.
        activeProcess[_account] = ActiveProcess({
            messageHash : _messageHash,
            messageBoxType : _messageBoxType
            });
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
    private
    view
    returns (uint256 /* nonce */)
    {
        ActiveProcess storage previousProcess = activeProcess[_account];

        if (previousProcess.messageHash == bytes32(0)) {
            return 1;
        }

        MessageBus.Message storage message =
        messages[previousProcess.messageHash];

        return message.nonce.add(1);
    }

    //TODO: This needs discusion. This doesnt apprear correct way of implementation
    /**
     *  @notice Public function completeUtilityTokenProtocolTransfer.
     *
     *  @return bool True if protocol transfer is completed, false otherwise.
     */
    function completeUtilityTokenProtocolTransfer()
    public
    onlyOrganisation
    isActive
    returns (bool)
    {
        return ProtocolVersioned(utilityToken).completeProtocolTransfer();
    }

    /**
     * @notice private function to calculate gateway link intent hash.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmGatewayLinkIntent function
     *
     * @param _nonce nonce of message
     *
     * @return bytes32 link intent hash
     */
    function hashLinkGateway(
        uint256 _nonce
    )
    private
    view
    returns (bytes32)
    {
        return GatewayLib.hashLinkGateway(
            gateway,
            address(this),
            messageBus,
            bounty,
            EIP20Interface(utilityToken).name(),
            EIP20Interface(utilityToken).symbol(),
            EIP20Interface(utilityToken).decimals(),
            _nonce,
            valueToken);


    }

}
