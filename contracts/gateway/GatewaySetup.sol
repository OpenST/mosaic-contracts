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
// Origin Chain: GatewaySetup Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import './ProofLib.sol';
import './MessageBus.sol';
import "./Hasher.sol";
import "./EIP20Interface.sol";
import "./Util.sol";
import "./CoreInterface.sol";
import "./SafeMath.sol";

contract GatewaySetup is Hasher {

    using SafeMath for uint256;

    /** Emitted whenever a gateway and coGateway linking is initiated. */
    event GatewayLinkInitiated(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _token
    );

    /** Emitted whenever a gateway and coGateway linking is completed. */
    event GatewayLinkProgressed(
        bytes32 indexed _messageHash,
        address _gateway,
        address _cogateway,
        address _token,
        bytes32 _unlockSecret
    );

    /* Struct */

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

    uint8 constant MESSAGE_BOX_OFFSET = 1;

    /** CoGateway contract address. */
    address public coGateway;

    /**
     * Message box.
     * @dev keep this is at location 1, in case this is changed then update
     *      constant OUTBOX_OFFSET accordingly.
     */
    MessageBus.MessageBox messageBox;

    /** Specifies if the Gateway and CoGateway contracts are linked. */
    bool public linked;

    /** Specifies if the Gateway is deactivated for any new staking process. */
    bool public deactivated;

    /** Organisation address. */
    address public organisation;

    /** amount of ERC20 which is staked by facilitator. */
    uint256 public bounty;

    /** address of ERC20 token. */
    EIP20Interface public token;

    /**
     * address of ERC20 token in which
     * the facilitator will stake for a process
     */
    EIP20Interface public bountyToken;

    /** address of core contract. */
    CoreInterface public core;

    /** Gateway link message hash. */
    bytes32 public gatewayLinkHash;

    /** Maps messageHash to the Message object. */
    mapping(bytes32 /*messageHash*/ => MessageBus.Message) messages;

    /** Maps blockHeight to storageRoot*/
    mapping(uint256 /* block height */ => bytes32) internal storageRoots;

    /**
     * Maps address to ActiveProcess object.
     *
     * Once the staking or unstaking process is started the corresponding
     * message hash is stored in ActiveProcess against the staker/redeemer
     * address. This is used to restrict simultaneous/multiple staking and
     * unstaking for a particular address. This is also used to determine the
     * nonce of the particular address. Refer getNonce for the details.
     */
    mapping(address /*address*/ => ActiveProcess) activeProcess;

    /* private variables */

    /** path to prove merkle account proof for CoGateway contract. */
    bytes internal encodedCoGatewayPath;

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
        EIP20Interface _token,
        EIP20Interface _bountyToken, //TODO: think of a better name
        CoreInterface _core,
        uint256 _bounty,
        address _organisation
    )
    {

        require(
            _token != address(0),
            "Token contract address must not be zero"
        );
        require(
            _bountyToken != address(0),
            "Token contract address for bounty must not be zero"
        );
        require(
            _core != address(0),
            "Core contract address must not be zero"
        );
        require(
            _organisation != address(0),
            "Organisation address must not be zero"
        );

        // gateway and cogateway is not linked yet so it is initialized as false
        linked = false;

        // gateway is active
        deactivated = false;

        token = _token;
        bountyToken = _bountyToken;
        core = _core;
        bounty = _bounty;
        organisation = _organisation;

    }

    /* External functions */

    /**
     * @notice Initiate the Gateway and CoGateway contracts linking.
     *
     * @param _coGateway CoGateway contract address.
     * @param _intentHash Gateway and CoGateway linking intent hash.
     *                    This is a sha3 of gateway address, cogateway address,
     *                    bounty, token name, token symbol, token decimals,
     *                    _nonce, token.
     * @param _nonce Nonce of the sender. Here in this case its organisation
     *               address
     * @param _sender The address that signs the message hash. In this case it
     *                has to be organisation address
     * @param _hashLock Hash lock, set by the facilitator.
     * @param _signature Signed data.
     *
     * @return messageHash_ Message hash
     */
    function initiateGatewayLink(
        address _coGateway,
        bytes32 _intentHash,
        uint256 _nonce,
        address _sender,
        bytes32 _hashLock,
        bytes _signature
    )
    external
    returns (bytes32 messageHash_)
    {
        require(
            linked == false,
            "Gateway contract must not be already linked"
        );
        require(
            deactivated == false,
            "Gateway contract must not be deactivated"
        );
        require(
            _coGateway != address(0),
            "CoGateway address must not be zero"
        );
        require(
            _sender == organisation,
            "Sender must be organisation address"
        );
        require(
            gatewayLinkHash == bytes32(0),
            "Linking is already initiated"
        );
        require(
            _hashLock != bytes32(0),
            "Hash lock must not be zero"
        );
        require(
            _signature.length == 65,
            "Signature must be of length 65"
        );

        // TODO: need to add check for MessageBus.
        //       (This is already done in other branch)
        bytes32 intentHash = hashLinkGateway(
            address(this),
            coGateway,
            bounty,
            token.name(),
            token.symbol(),
            token.decimals(),
            _nonce,
            token);

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

        // initiate new new outbox process
        initiateNewProcess(
            _sender,
            _nonce,
            messageHash_,
            MessageBus.MessageBoxType.Outbox
        );

        // Declare message in outbox
        MessageBus.declareMessage(
            messageBox,
            GATEWAY_LINK_TYPEHASH,
            messages[messageHash_],
            _signature
        );

        // update the coGateway address
        coGateway = _coGateway;

        // update gateway link hash
        gatewayLinkHash = messageHash_;

        // update the encodedCoGatewayPath
        encodedCoGatewayPath = ProofLib.bytes32ToBytes(
            keccak256(abi.encodePacked(coGateway))
        );

        // emit GatewayLinkInitiated event
        emit GatewayLinkInitiated(
            messageHash_,
            address(this),
            coGateway,
            token
        );
    }

    /**
     * @notice Complete the Gateway and CoGateway contracts linking. This will
     *         set the variable linked to true, and thus it will activate the
     *         Gateway contract for stake and mint.
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

        // Progress the outbox.
        MessageBus.progressOutbox(
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
            address(this),
            coGateway,
            token,
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
            gasLimit: _gasLimit,
            sender : _account,
            hashLock : _hashLock,
            gasConsumed: 0
            }
        );
    }

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

        if (previousProcess.messageHash != bytes32(0)) {

            MessageBus.MessageStatus status;
            if (previousProcess.messageBoxType ==
                MessageBus.MessageBoxType.Inbox) {
                status = messageBox.inbox[previousMessageHash_];
            } else{
                status = messageBox.outbox[previousMessageHash_];
            }
            require(
                status != MessageBus.MessageStatus.Progressed ||
                status != MessageBus.MessageStatus.Revoked,
                "Prevous process is not completed"
            );
            //TODO: Commenting below line. Please check if deleting this will
            //      effect any process related to merkle proof in other chain.
            //delete messageBox.outbox[previousMessageHash_];

            delete messages[previousMessageHash_];
        }

        // Update the active proccess.
        activeProcess[_account] = ActiveProcess({
            messageHash: _messageHash,
            messageBoxType: _messageBoxType
            });
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
}
