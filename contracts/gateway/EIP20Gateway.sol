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
// Origin Chain: Gateway Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


/*

           Origin chain      |       Auxiliary chain
-------------------------------------------------------------------------------
           EIP20Gateway - - - - - - - - - - - EIP20CoGateway
-------------------------------------------------------------------------------

1. Stake and Mint: Normal flow

           stake             --->   confirmStakeIntent
             |
      progressStake (HL)     --->   progressMint (HL)
-------------------------------------------------------------------------------
2. Stake and Mint (Revert): Normal flow

           stake             --->   confirmStakeIntent
             |
        revertStake          --->   confirmRevertStakeIntent
                                            |
      progressRevertStake    <---   progressRevertStake
-------------------------------------------------------------------------------
3. Stake and Mint: Incase the facilitator is not able to progress

    stake (by facilitator)    --->   confirmStakeIntent (by facilitator)
                               |
                        facilitator (offline)
             |
     progressStakeWithProof   --->   progressMintWithProof
-------------------------------------------------------------------------------
*/

import "./SimpleStake.sol";
import "./GatewayBase.sol";
import "../lib/OrganizationInterface.sol";

/**
 * @title EIP20Gateway Contract
 *
 * @notice EIP20Gateway act as medium to send messages from origin chain to
 *         auxiliary chain. Currently gateway supports stake and revert stake message.
 */
contract EIP20Gateway is GatewayBase {

    /* Events */

    /** Emitted whenever a stake process is initiated. */
    event StakeIntentDeclared(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amount
    );

    /** Emitted whenever a stake is completed. */
    event StakeProgressed(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        uint256 _amount,
        bool _proofProgress,
        bytes32 _unlockSecret
    );

    /** Emitted whenever a process is initiated to revert stake. */
    event RevertStakeIntentDeclared(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        uint256 _amount
    );

    /** Emitted whenever a stake is reverted. */
    event StakeReverted(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        uint256 _amount
    );

    /** Emitted whenever a redeem intent is confirmed. */
    event RedeemIntentConfirmed(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _blockHeight,
        bytes32 _hashLock
    );

    /** Emitted whenever a unstake process is complete. */
    event UnstakeProgressed(
        bytes32 indexed _messageHash,
        address _redeemer,
        address _beneficiary,
        uint256 _redeemAmount,
        uint256 _unstakeAmount,
        uint256 _rewardAmount,
        bool _proofProgress,
        bytes32 _unlockSecret
    );

    /** Emitted whenever a revert redeem intent is confirmed. */
    event RevertRedeemIntentConfirmed(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount
    );

    /** Emitted whenever revert redeem is completed. */
    event RevertRedeemComplete(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount
    );


    /* Struct */

    /**
     * Stake stores the stake amount, beneficiary address, message data and
     * facilitator address.
     */
    struct Stake {

        /** Amount that will be staked. */
        uint256 amount;

        /**
         * Address where the utility tokens will be minted in the
         * auxiliary chain.
         */
        address beneficiary;

        /** Bounty kept by facilitator for stake message transfer. */
        uint256 bounty;
    }

    /**
     * Unstake stores the unstake/redeem information
     * like unstake/redeem amount, beneficiary address, message data.
     */
    struct Unstake {

        /** Amount that will be unstaked. */
        uint256 amount;

        /** Address that will receive the unstaked token. */
        address beneficiary;
    }


    /* Public Variables */

    /** Specifies if the Gateway is activated for any new process. */
    bool public activated;

    /** Escrow address to lock staked fund. */
    SimpleStake public stakeVault;

    /** Address of EIP20 token. */
    EIP20Interface public token;

    /**
     * Address of ERC20 token in which the facilitator will stake(bounty)
     * for a process.
     */
    EIP20Interface public baseToken;

    /** Address where token will be burned. */
    address public burner;

    /** Maps messageHash to the Stake object. */
    mapping(bytes32 /*messageHash*/ => Stake) stakes;

    /** Maps messageHash to the Unstake object. */
    mapping(bytes32 /*messageHash*/ => Unstake) unstakes;


    /* Modifiers */

    /** Checks that contract is active. */
    modifier isActive() {
        require(
            activated == true,
            "Gateway is not activated."
        );
        _;
    }


    /* Constructor */

    /**
     * @notice Initialize the contract by providing the ERC20 token address
     *         for which the gateway will enable facilitation of stake and
     *         mint.
     *
     * @param _token The ERC20 token contract address that will be
     *               staked and corresponding utility tokens will be minted
     *               in auxiliary chain.
     * @param _baseToken The ERC20 token address that will be used for
     *                     staking bounty from the facilitators.
     * @param _stateRootProvider Contract address which implements
     *                           StateRootInterface.
     * @param _bounty The amount that facilitator will stakes to initiate the
     *                stake process.
     * @param _organization Address of an organization contract.
     * @param _burner Address where tokens will be burned.
     */
    constructor(
        EIP20Interface _token,
        EIP20Interface _baseToken,
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        OrganizationInterface _organization,
        address _burner
    )
        GatewayBase(
            _stateRootProvider,
            _bounty,
            _organization
        )
        public
    {
        require(
            address(_token) != address(0),
            "Token contract address must not be zero."
        );
        require(
            address(_baseToken) != address(0),
            "Base token contract address for bounty must not be zero"
        );
        token = _token;
        baseToken = _baseToken;
        burner = _burner;
        // gateway is in-active initially.
        activated = false;
        // deploy simpleStake contract that will keep the staked amounts.
        stakeVault = new SimpleStake(_token, address(this));
    }


    /* External functions */

    /**
     * @notice Initiates the stake process.  In order to stake the staker
     *         needs to approve Gateway contract for stake amount.
     *         Staked amount is transferred from staker address to
     *         Gateway contract. Bounty amount is also transferred from staker.
     *
     * @param _amount Stake amount that will be transferred from the staker
     *                account.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done.
     * @param _gasLimit Gas limit that staker is ready to pay.
     * @param _nonce Nonce of the staker address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ Message hash is unique for each request.
     */
    function stake(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
        external
        isActive
        returns (bytes32 messageHash_)
    {
        address staker = msg.sender;

        require(
            _amount > uint256(0),
            "Stake amount must not be zero."
        );

        require(
            _beneficiary != address(0),
            "Beneficiary address must not be zero."
        );

        /*
         * Maximum reward possible is _gasPrice * _gasLimit, we check this
         * upfront in this function to make sure that after minting of the
         * tokens it is possible to give the reward to the facilitator.
         */
        require(
            _amount > _gasPrice.mul(_gasLimit),
            "Maximum possible reward must be less than the stake amount."
        );

        // Get the stake intent hash.
        bytes32 intentHash = GatewayLib.hashStakeIntent(
            _amount,
            _beneficiary,
            address(this)
        );

        MessageBus.Message memory message = getMessage(
            intentHash,
            _nonce,
            _gasPrice,
            _gasLimit,
            staker,
            _hashLock
        );

        messageHash_ = storeMessage(message);

        registerOutboxProcess(
            staker,
            _nonce,
            messageHash_
        );

        // New stake object
        stakes[messageHash_] = Stake({
            amount : _amount,
            beneficiary : _beneficiary,
            bounty : bounty
        });

        // Declare message in outbox
        MessageBus.declareMessage(
            messageBox,
            messages[messageHash_]
        );

        // Transfer staker amount to the gateway.
        require(
            token.transferFrom(staker, address(this), _amount),
            "Stake amount must be transferred to gateway"
        );

        // Transfer the bounty amount to the gateway.
        require(
            baseToken.transferFrom(staker, address(this), bounty),
            "Bounty amount must be transferred to gateway"
        );

        emit StakeIntentDeclared(
            messageHash_,
            staker,
            _nonce,
            _beneficiary,
            _amount
        );
    }

    /**
     * @notice Completes the stake process.
     *
     * @param _messageHash Message hash.
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      staker while initiating the stake.
     *
     * @return staker_ Staker address.
     * @return stakeAmount_ Stake amount.
     */
    function progressStake(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
        external
        returns (
            address staker_,
            uint256 stakeAmount_
        )
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero"
        );

        // Get the message object
        MessageBus.Message storage message = messages[_messageHash];

        // Progress outbox
        MessageBus.progressOutbox(
            messageBox,
            message,
            _unlockSecret
        );

        (staker_, stakeAmount_) = progressStakeInternal(
            _messageHash,
            message,
            _unlockSecret,
            false
        );
    }

    /**
     * @notice Completes the stake process by providing the merkle proof
     *         instead of unlockSecret. In case the facilitator process is not
     *         able to complete the stake and mint process then this is an
     *         alternative approach to complete the process
     *
     * @dev This can be called to prove that the inbox status of messageBox on
     *      CoGateway is either declared or progressed.
     *
     * @param _messageHash Message hash.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox of CoGateway.
     * @param _blockHeight Block number for which the proof is valid.
     * @param _messageStatus Message status i.e. Declared or Progressed that
     *                       will be proved.
     *
     * @return staker_ Staker address
     * @return stakeAmount_ Stake amount
     */
    function progressStakeWithProof(
        bytes32 _messageHash,
        bytes calldata _rlpParentNodes,
        uint256 _blockHeight,
        uint256 _messageStatus
    )
        external
        returns (
            address staker_,
            uint256 stakeAmount_
        )
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP encoded parent nodes must not be zero."
        );

        bytes32 storageRoot = storageRoots[_blockHeight];

        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero."
        );

        // Get the message object
        MessageBus.Message storage message = messages[_messageHash];

        MessageBus.progressOutboxWithProof(
            messageBox,
            message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot,
            MessageBus.MessageStatus(_messageStatus)
        );

        (staker_, stakeAmount_) = progressStakeInternal(
            _messageHash,
            message,
            bytes32(0),
            true
        );

    }

    /**
     * @notice Revert stake process and get the stake
     *         amount back. Only staker can revert stake by providing
     *         penalty i.e. 1.5 times of bounty amount. On progress revert stake
     *         penalty and facilitator bounty will be burned.
     *
     * @dev To revert the the sender must sign the sha3(messageHash, nonce+1)
     *
     * @param _messageHash Message hash.
     *
     * @return staker_ Staker address
     * @return stakerNonce_ Staker nonce
     * @return amount_ Stake amount
     */
    function revertStake(
        bytes32 _messageHash
    )
        external
        returns (
            address staker_,
            uint256 stakerNonce_,
            uint256 amount_
        )
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );

        MessageBus.Message storage message = messages[_messageHash];

        require(
            message.sender == msg.sender,
            "Only staker can revert stake."
        );

        // Declare stake revocation.
        MessageBus.declareRevocationMessage(
            messageBox,
            message
        );

        staker_ = message.sender;
        stakerNonce_ = message.nonce;
        amount_ = stakes[_messageHash].amount;

        // Penalty charged to staker for revert stake.
        uint256 penalty = penaltyFromBounty(stakes[_messageHash].bounty);

        // Transfer the penalty amount.
        require(
            baseToken.transferFrom(msg.sender, address(this), penalty),
            "Staker must approve gateway for penalty amount."
        );

        emit RevertStakeIntentDeclared(
            _messageHash,
            staker_,
            stakerNonce_,
            amount_
        );
    }

    /**
     * @notice Complete revert stake by providing the merkle proof.
     *         This method will return stake amount to staker and burn
     *         facilitator bounty and staker penalty.
     *
     * @param _messageHash Message hash.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent node data to prove
     *                        DeclaredRevocation in messageBox inbox of
     *                        CoGateway.
     *
     * @return staker_ Staker address.
     * @return stakerNonce_ Staker nonce.
     * @return amount_ Stake amount.
     */
    function progressRevertStake(
        bytes32 _messageHash,
        uint256 _blockHeight,
        bytes calldata _rlpParentNodes
    )
        external
        returns (
            address staker_,
            uint256 stakerNonce_,
            uint256 amount_
        )
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero"
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero"
        );

        // Get the message object
        MessageBus.Message storage message = messages[_messageHash];
        require(
            message.intentHash != bytes32(0),
            "StakeIntentHash must not be zero"
        );

        // Get the storageRoot for the given block height
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        // Progress with revocation message
        MessageBus.progressOutboxRevocation(
            messageBox,
            message,
            MESSAGE_BOX_OFFSET,
            _rlpParentNodes,
            storageRoot,
            MessageBus.MessageStatus.Revoked
        );

        staker_ = message.sender;
        stakerNonce_ = message.nonce;
        amount_ = stakes[_messageHash].amount;

        // transfer the staked amount to the staker
        token.transfer(message.sender, amount_);

        // burn facilitator bounty
        baseToken.transfer(burner, bounty);
        //penalty charged to staker
        uint256 penalty = penaltyFromBounty(stakes[_messageHash].bounty);

        // burn staker penalty
        baseToken.transfer(burner, penalty);

        // delete the stake data
        delete stakes[_messageHash];

        emit StakeReverted(
            _messageHash,
            staker_,
            stakerNonce_,
            amount_
        );
    }

    /**
     * @notice Declare redeem intent
     *
     * @param _redeemer Redeemer address.
     * @param _redeemerNonce Redeemer nonce.
     * @param _beneficiary Address where the redeemed tokens will be
     *                     transferred.
     * @param _amount Redeem amount.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the
     *                  redeem and unstake process done
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _blockHeight Block number for which the proof is valid.
     * @param _hashLock Hash lock.
     * @param _rlpParentNodes RLP encoded parent node data to prove
     *                        Declared in messageBox outbox of
     *                        CoGateway.
     *
     * @return messageHash_ Message hash.
     */
    function confirmRedeemIntent(
        address _redeemer,
        uint256 _redeemerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _blockHeight,
        bytes32 _hashLock,
        bytes calldata _rlpParentNodes
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the initial gas.
        uint256 initialGas = gasleft();

        require(
            _redeemer != address(0),
            "Redeemer address must not be zero"
        );
        require(
            _beneficiary != address(0),
            "Beneficiary address must not be zero"
        );
        require(
            _amount != 0,
            "Redeem amount must not be zero"
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP encoded parent nodes must not be zero"
        );

        bytes32 intentHash = hashRedeemIntent(
            _amount,
            _beneficiary
        );

        MessageBus.Message memory message = MessageBus.Message(
            intentHash,
            _redeemerNonce,
            _gasPrice,
            _gasLimit,
            _redeemer,
            _hashLock,
            0 // Gas consumed will be updated at the end of this function.
        );
        messageHash_ = storeMessage(message);

        registerInboxProcess(
            message.sender,
            message.nonce,
            messageHash_
        );

        unstakes[messageHash_] = Unstake({
            amount : _amount,
            beneficiary : _beneficiary
        });

        confirmRedeemIntentInternal(
            messages[messageHash_],
            _blockHeight,
            _rlpParentNodes
        );

        // Emit RedeemIntentConfirmed event.
        emit RedeemIntentConfirmed(
            messageHash_,
            _redeemer,
            _redeemerNonce,
            _beneficiary,
            _amount,
            _blockHeight,
            _hashLock
        );

        // Update the gas consumed for this function.
        messages[messageHash_].gasConsumed = initialGas.sub(gasleft());
    }

    /**
     * @notice Complete unstake
     *
     * @param _messageHash Message hash.
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      facilitator while initiating the redeem
     *
     * @return redeemer_ Redeemer address
     * @return redeemAmount_ Total amount for which the redeem was
     *                       initiated. The reward amount is deducted from the
     *                       total redeem amount and is given to the
     *                       facilitator.
     * @return unstakeAmount_ Actual unstake amount, after deducting the reward
     *                        from the total redeem amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator
     */
    function progressUnstake(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
        external
        returns (
            uint256 redeemAmount_,
            uint256 unstakeAmount_,
            uint256 rewardAmount_
        )
    {
        // Get the inital gas
        uint256 initialGas = gasleft();

        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );
        // Get the message object.
        MessageBus.Message storage message = messages[_messageHash];

        // Progress inbox
        MessageBus.progressInbox(
            messageBox,
            message,
            _unlockSecret
        );
        (redeemAmount_, unstakeAmount_, rewardAmount_) =
        progressUnstakeInternal(_messageHash, initialGas, _unlockSecret, false);

    }

    /**
     * @notice Gets the penalty amount. If the message hash does not exist in
     *         stakes mapping it will return zero amount. If the message is
     *         already progressed or revoked then the penalty amount will be
     *         zero.
     *
     * @param _messageHash Message hash.
     *
     * @return penalty_ Penalty amount.
     */
    function penalty(bytes32 _messageHash)
        external
        view
        returns (uint256 penalty_)
    {
        penalty_ = super.penaltyFromBounty(stakes[_messageHash].bounty);
    }

    /* Public Functions */

    /**
     * @notice Completes the redeem process by providing the merkle proof
     *         instead of unlockSecret. In case the facilitator process is not
     *         able to complete the redeem and unstake process then this is an
     *         alternative approach to complete the process
     *
     * @dev This can be called to prove that the outbox status of messageBox on
     *      CoGateway is either declared or progressed.
     *
     * @param _messageHash Message hash.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox inbox of CoGateway.
     * @param _blockHeight Block number for which the proof is valid.
     * @param _messageStatus Message status i.e. Declared or Progressed that
     *                       will be proved.
     *
     * @return redeemAmount_ Total amount for which the redeem was
     *                       initiated. The reward amount is deducted from the
     *                       total redeem amount and is given to the
     *                       facilitator.
     * @return unstakeAmount_ Actual unstake amount, after deducting the reward
     *                        from the total redeem amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator
     */
    function progressUnstakeWithProof(
        bytes32 _messageHash,
        bytes calldata _rlpParentNodes,
        uint256 _blockHeight,
        uint256 _messageStatus
    )
        external
        returns (
            uint256 redeemAmount_,
            uint256 unstakeAmount_,
            uint256 rewardAmount_
        )
    {
        // Get the initial gas.
        uint256 initialGas = gasleft();

        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero"
        );

        // Get the storage root for the given block height
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        // Get the message object.
        MessageBus.Message storage message = messages[_messageHash];

        MessageBus.progressInboxWithProof(
            messageBox,
            message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot,
            MessageBus.MessageStatus(_messageStatus)
        );

        (redeemAmount_, unstakeAmount_, rewardAmount_) =
        progressUnstakeInternal(_messageHash, initialGas, bytes32(0), true);
    }


    /** External methods */

    /**
     * @notice Declare redeem revert intent.
     *         This will set message status to revoked. This method will also
     *         clear unstakes mapping storage.
     *
     * @param _messageHash Message hash.
     * @param _blockHeight Block number for which the proof is valid.
     * @param _rlpParentNodes RLP encoded parent node data to prove
     *                        DeclaredRevocation in messageBox outbox of
     *                        CoGateway.
     *
     * @return redeemer_ Redeemer address.
     * @return redeemerNonce_ Redeemer nonce.
     * @return amount_ Redeem amount.
     */
    function confirmRevertRedeemIntent(
        bytes32 _messageHash,
        uint256 _blockHeight,
        bytes calldata _rlpParentNodes
    )
        external
        returns (
            address redeemer_,
            uint256 redeemerNonce_,
            uint256 amount_
        )
    {
        // Get the initial gas value
        uint256 initialGas = gasleft();

        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero"
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero"
        );

        // Get the message object.
        MessageBus.Message storage message = messages[_messageHash];
        require(
            message.intentHash != bytes32(0),
            "RevertRedeem intent hash must not be zero"
        );

        // Get the storage root
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        // Confirm revocation
        MessageBus.confirmRevocation(
            messageBox,
            message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot
        );

        redeemer_ = message.sender;
        redeemerNonce_ = message.nonce;
        amount_ = unstakes[_messageHash].amount;

        // delete the unstake data
        delete unstakes[_messageHash];

        // Emit RevertRedeemIntentConfirmed event
        emit RevertRedeemIntentConfirmed(
            _messageHash,
            redeemer_,
            redeemerNonce_,
            amount_
        );

        // Update the gas consumed for this function.
        message.gasConsumed = initialGas.sub(gasleft());
    }

    /**
     * @notice Activate Gateway contract. Can be set only by the
     *         Organization address only once by passing co-gateway address.
     *
     * @param _coGatewayAddress Address of cogateway.
     *
     * @return success_ `true` if value is set
     */
    function activateGateway(
            address _coGatewayAddress
    )
        external
        onlyOrganization
        returns (bool success_)
    {

        require(
            _coGatewayAddress != address(0),
            "Co-gateway address must not be zero."
        );
        require(
            remoteGateway == address(0),
            "Gateway was already activated once."
        );

        remoteGateway = _coGatewayAddress;

        // update the encodedGatewayPath
        encodedGatewayPath = GatewayLib.bytes32ToBytes(
            keccak256(abi.encodePacked(remoteGateway))
        );
        activated = true;
        success_ = true;
    }

    /**
     * @notice Deactivate Gateway contract. Can be set only by the
     *         organization address
     *
     * @return success_  `true` if value is set
     */
    function deactivateGateway()
        external
        onlyOrganization
        returns (bool success_)
    {
        require(
            activated == true,
            "Gateway is already deactivated."
        );
        activated = false;
        success_ = true;
    }


    /* Private functions */

    /**
     * @notice private function to execute confirm redeem intent.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmRedeemIntent function
     *
     * @param _message message object
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent nodes.
     *
     * @return `true` if executed successfully
     */
    function confirmRedeemIntentInternal(
        MessageBus.Message storage _message,
        uint256 _blockHeight,
        bytes memory _rlpParentNodes
    )
        private
        returns (bool)
    {
        // Get storage root
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        // Confirm message
        MessageBus.confirmMessage(
            messageBox,
            _message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot
        );

        return true;
    }

    /**
     * @notice Private function contains logic for process stake.
     *
     * @param _messageHash Message hash.
     * @param _message Message object.
     * @param _unlockSecret For process with hash lock, proofProgress event
     *                      param is set to false otherwise set to true.
     *
     * @return staker_ Staker address
     * @return stakeAmount_ Stake amount
     */
    function progressStakeInternal(
        bytes32 _messageHash,
        MessageBus.Message storage _message,
        bytes32 _unlockSecret,
        bool _proofProgress
    )
        private
        returns (
            address staker_,
            uint256 stakeAmount_
        )
    {

        // Get the staker address
        staker_ = _message.sender;

        //Get the stake amount.
        stakeAmount_ = stakes[_messageHash].amount;

        // Transfer the staked amount to stakeVault.
        token.transfer(address(stakeVault), stakeAmount_);

        baseToken.transfer(msg.sender, stakes[_messageHash].bounty);

        // Delete the stake entry.
        delete stakes[_messageHash];

        emit StakeProgressed(
            _messageHash,
            staker_,
            _message.nonce,
            stakeAmount_,
            _proofProgress,
            _unlockSecret
        );
    }

    /**
     * @notice This is internal method for process unstake called from external
     *         methods which processUnstake(with hashlock) and
     *         processUnstakeWithProof
     *
     * @param _messageHash hash to identify message
     * @param _initialGas initial available gas during process unstake call.
     * @param _unlockSecret Block number for which the proof is valid
     * @param _proofProgress true if progress with proof and false if
     *                       progress with unlock secret.
     *
     * @return redeemAmount_ Total amount for which the redeem was
     *                       initiated. The reward amount is deducted from the
     *                       total redeem amount and is given to the
     *                       facilitator.
     * @return unstakeAmount_ Actual unstake amount, after deducting the reward
     *                        from the total redeem amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator
     */
    function progressUnstakeInternal(
        bytes32 _messageHash,
        uint256 _initialGas,
        bytes32 _unlockSecret,
        bool _proofProgress
    )
        private
        returns (
            uint256 redeemAmount_,
            uint256 unstakeAmount_,
            uint256 rewardAmount_
        )
    {

        Unstake storage unStake = unstakes[_messageHash];
        // Get the message object.
        MessageBus.Message storage message = messages[_messageHash];

        redeemAmount_ = unStake.amount;

        /*
         * Reward calculation depends upon
         *  - the gas consumed in target chain for confirmation and progress steps.
         *  - gas price and gas limit provided in the message.
         */
        (rewardAmount_, message.gasConsumed) = feeAmount(
            message.gasConsumed,
            message.gasLimit,
            message.gasPrice,
            _initialGas
        );

        require(
            rewardAmount_ < redeemAmount_,
            "Reward amount must be less than redeem amount."
        );

        unstakeAmount_ = redeemAmount_.sub(rewardAmount_);
        // Release the amount to beneficiary.
        stakeVault.releaseTo(unStake.beneficiary, unstakeAmount_);

        if (rewardAmount_ > 0) {
            // Reward facilitator with the reward amount.
            stakeVault.releaseTo(msg.sender, rewardAmount_);
        }

        emit UnstakeProgressed(
            _messageHash,
            message.sender,
            unStake.beneficiary,
            redeemAmount_,
            unstakeAmount_,
            rewardAmount_,
            _proofProgress,
            _unlockSecret
        );

        // Delete the unstake data.
        delete unstakes[_messageHash];
    }

    /**
     * @notice private function to calculate redeem intent hash.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmRedeemIntent function
     *
     * @param _amount redeem amount
     * @param _beneficiary unstake account
     *
     * @return bytes32 redeem intent hash
     */
    function hashRedeemIntent(
        uint256 _amount,
        address _beneficiary
    )
        private
        view
        returns(bytes32)
    {
        return GatewayLib.hashRedeemIntent(
            _amount,
            _beneficiary,
            remoteGateway
        );
    }

}
