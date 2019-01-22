pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

/*

                Origin chain      |       Auxiliary chain
-------------------------------------------------------------------------------
                EIP20Gateway - - - - - - - - - - -EIP20CoGateway
-------------------------------------------------------------------------------

1. Redeem and Unstake: Normal flow

            confirmRedeemIntent  <---   redeem
                                           |
        progressUnstake (HL)     --->   progressRedeem (HL)
-------------------------------------------------------------------------------
2. Redeem and Unstake (Revert): Normal flow

            confirmRedeemIntent   <---   redeem
                                            |
      confirmRevertRedeemIntent   <---   revertRedeem
            |
        progressRevertRedeem      --->   progressRevertRedeem
-------------------------------------------------------------------------------
3.  Redeem and Unstake: Incase the facilitator is not able to progress

             confirmRedeemIntent   <---   redeem
             (by facilitator)             (by facilitator)
                                    |
                            facilitator (offline)
                                            |
        progressUnstakeWithProof  <---   progressRedeemWithProof
-------------------------------------------------------------------------------
*/

import "./UtilityTokenInterface.sol";
import "./GatewayBase.sol";
import "../lib/OrganizationInterface.sol";

/**
 * @title EIP20CoGateway Contract
 *
 * @notice EIP20CoGateway act as medium to send messages from auxiliary
 *         chain to origin chain. Currently CoGateway supports redeem and
 *         unstake and revert redeem message
 */
contract EIP20CoGateway is GatewayBase {

    /* Events */

    /** Emitted whenever a stake intent is confirmed. */
    event StakeIntentConfirmed(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _blockHeight,
        bytes32 _hashLock
    );

    /** Emitted whenever a utility tokens are minted. */
    event MintProgressed(
        bytes32 indexed _messageHash,
        address _staker,
        address _beneficiary,
        uint256 _stakeAmount,
        uint256 _mintedAmount,
        uint256 _rewardAmount,
        bool _proofProgress,
        bytes32 _unlockSecret
    );

    /** Emitted whenever revert stake intent is confirmed. */
    event RevertStakeIntentConfirmed(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        uint256 _amount
    );

    /** Emitted whenever a stake intent is reverted. */
    event RevertStakeProgressed(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        uint256 _amount
    );

    /** Emitted whenever redeem is initiated. */
    event RedeemIntentDeclared(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        address _beneficiary,
        uint256 _amount
    );

    /** Emitted whenever redeem is completed. */
    event RedeemProgressed(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount,
        bool _proofProgress,
        bytes32 _unlockSecret
    );

    /** Emitted whenever revert redeem is initiated. */
    event RevertRedeemDeclared(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount
    );

    /** Emitted whenever revert redeem is complete. */
    event RedeemReverted(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount
    );


    /* Struct */

    /**
     * Redeem stores the redeem information, beneficiary address, message data
     * and facilitator address.
     */
    struct Redeem {

        /** Amount that will be redeemed. */
        uint256 amount;

        /**
         * Address where the value tokens will be unstaked in the origin
         * chain.
         */
        address beneficiary;

        /** Bounty amount kept by facilitator for transferring redeem messages. */
        uint256 bounty;
    }

    /**
     * Mint stores the minting information like mint amount,
     * beneficiary address, message data.
     */
    struct Mint {

        /** Amount that will be minted. */
        uint256 amount;

        /** Address for which the utility tokens will be minted */
        address payable beneficiary;
    }

    /* Public Variables */

    /** Address of utility token. */
    address public utilityToken;

    /** Address of value token. */
    address public valueToken;

    /** Address where token will be burned. */
    address payable public burner;

    /** Maps messageHash to the Mint object. */
    mapping(bytes32 => Mint) public mints;

    /** Maps messageHash to the Redeem object. */
    mapping(bytes32 => Redeem) public redeems;


    /* Constructor */

    /**
     * @notice Initialize the contract by providing the Gateway contract
     *         address for which the CoGateway will enable facilitation of
     *         mint and redeem.
     *
     * @param _valueToken The value token contract address.
     * @param _utilityToken The utility token address that will be used for
     *                      minting the utility token.
     * @param _stateRootProvider Contract address which implements
     *                           StateRootInterface.
     * @param _bounty The amount that facilitator stakes to initiate the stake
     *                process.
     * @param _organization Address of an organization contract.
     * @param _gateway Gateway contract address.
     * @param _burner Address where tokens will be burned.
     */
    constructor(
        address _valueToken,
        address _utilityToken,
        StateRootInterface _stateRootProvider,
        uint256 _bounty,
        OrganizationInterface _organization,
        address _gateway,
        address payable _burner
    )
        GatewayBase(
            _stateRootProvider,
            _bounty,
            _organization
        )
        public
    {
        require(
            _valueToken != address(0),
            "Value token address must not be zero."
        );
        require(
            _utilityToken != address(0),
            "Utility token address must not be zero."
        );
        require(
            _gateway != address(0),
            "Gateway address must not be zero."
        );

        valueToken = _valueToken;
        utilityToken = _utilityToken;
        remoteGateway = _gateway;
        burner = _burner;

        // Update the encodedGatewayPath.
        encodedGatewayPath = GatewayLib.bytes32ToBytes(
            keccak256(abi.encodePacked(remoteGateway))
        );
    }

    /* External functions */

    /**
     * @notice Complete mint process by minting the utility tokens
     *
     * @param _messageHash Message hash.
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      facilitator while initiating the stake
     *
     * @return beneficiary_ Address to which the utility tokens will be
     *                      transferred after minting
     * @return stakeAmount_ Total amount for which the stake was
     *                      initiated. The reward amount is deducted from the
     *                      this amount and is given to the facilitator.
     * @return mintedAmount_ Actual minted amount, after deducting the reward
     *                       from the total (stake) amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator
     */
    function progressMint(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
        external
        returns (
            address beneficiary_,
            uint256 stakeAmount_,
            uint256 mintedAmount_,
            uint256 rewardAmount_
        )
    {
        // Get the initial gas amount.
        uint256 initialGas = gasleft();

        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );

        MessageBus.Message storage message = messages[_messageHash];

        // Progress inbox.
        MessageBus.progressInbox(
            messageBox,
            message,
            _unlockSecret
        );

        (beneficiary_, stakeAmount_, mintedAmount_, rewardAmount_) =
            progressMintInternal(_messageHash, initialGas, false, _unlockSecret);
    }

    /**
     * @notice Completes the mint process by providing the merkle proof
     *         instead of unlockSecret. In case the facilitator process is not
     *         able to complete the stake and mint process then this is an
     *         alternative approach to complete the process
     *
     * @dev This can be called to prove that the outbox status of messageBox on
     *      Gateway is either declared or progressed.
     *
     * @param _messageHash Message hash.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox inbox of Gateway.
     * @param _blockHeight Block number for which the proof is valid.
     * @param _messageStatus Message status i.e. Declared or Progressed that
     *                       will be proved.
     *
     * @return  beneficiary_ Address to which the utility tokens will be
     *                      transferred after minting.
     * @return stakeAmount_ Total amount for which the stake was initiated. The
     *                      reward amount is deducted from the total amount and
     *                      is given to the facilitator.
     * @return mintedAmount_ Actual minted amount, after deducting the reward
     *                       from the total amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator.
     */
    function progressMintWithProof(
        bytes32 _messageHash,
        bytes memory _rlpParentNodes,
        uint256 _blockHeight,
        uint256 _messageStatus
    )
        public
        returns (
            address beneficiary_,
            uint256 stakeAmount_,
            uint256 mintedAmount_,
            uint256 rewardAmount_
        )
    {
        // Get the inital gas.
        uint256 initialGas = gasleft();

        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero."
        );

        // Get the storage root for the given block height.
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero."
        );

        MessageBus.Message storage message = messages[_messageHash];

        MessageBus.progressInboxWithProof(
            messageBox,
            message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot,
            MessageBus.MessageStatus(_messageStatus)
        );

        (beneficiary_,
        stakeAmount_,
        mintedAmount_,
        rewardAmount_) =
        progressMintInternal(_messageHash, initialGas, true, bytes32(0));
    }

    /**
     * @notice Declare stake revert intent. This will set message status to
     *         revoked. This method will also clear mint mapping storage.
     *
     * @param _messageHash Message hash.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent node data to prove
     *                        DeclaredRevocation in messageBox outbox of
     *                        Gateway.
     *
     * @return staker_ Staker address
     * @return stakerNonce_ Staker nonce
     * @return amount_ Redeem amount
     */
    function confirmRevertStakeIntent(
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
            "Message hash must not be zero."
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero."
        );

        MessageBus.Message storage message = messages[_messageHash];
        require(
            message.intentHash != bytes32(0),
            "Stake intent hash must not be zero."
        );

        // Get the storage root.
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero."
        );

        // Confirm revocation.
        MessageBus.confirmRevocation(
            messageBox,
            message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot
        );

        Mint storage mint = mints[_messageHash];

        staker_ = message.sender;
        stakerNonce_ = message.nonce;
        amount_ = mint.amount;

        emit RevertStakeIntentConfirmed(
            _messageHash,
            message.sender,
            message.nonce,
            mint.amount
        );

        delete mints[_messageHash];
    }

    /**
     * @notice Completes the redeem process. This decreases token supply
     *         on successful redeem.
     *
     * @param _messageHash Message hash for redeem message.
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      facilitator while initiating the redeem.
     *
     * @return redeemer_ Redeemer address.
     * @return redeemAmount_ Redeem amount.
     */
    function progressRedeem(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
        external
        returns (
            address redeemer_,
            uint256 redeemAmount_
        )
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );

        MessageBus.Message storage message = messages[_messageHash];

        // Get the redeemer address.
        redeemer_ = message.sender;

        redeemAmount_ = redeems[_messageHash].amount;

        MessageBus.progressOutbox(
            messageBox,
            message,
            _unlockSecret
        );

        (redeemer_, redeemAmount_) =
            progressRedeemInternal(_messageHash, message, false, _unlockSecret);

    }

    /**
     * @notice Completes the redeem process by providing the merkle proof
     *         instead of unlockSecret. In case the facilitator process is not
     *         able to complete the redeem and unstake process then this is an
     *         alternative approach to complete the process
     *
     * @dev This can be called to prove that the inbox status of messageBox on
     *      Gateway is either declared or progressed.
     *
     * @param _messageHash Message hash.
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                               messageBox outbox of Gateway
     * @param _blockHeight Block number for which the proof is valid
     * @param _messageStatus Message status i.e. Declared or Progressed that
     *                       will be proved.
     *
     * @return redeemer_ Redeemer address
     * @return redeemAmount_ Redeem amount
     */
    function progressRedeemWithProof(
        bytes32 _messageHash,
        bytes calldata _rlpParentNodes,
        uint256 _blockHeight,
        uint256 _messageStatus
    )
        external
        returns (
            address redeemer_,
            uint256 redeemAmount_
        )
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );
        require(
            _rlpParentNodes.length > 0,
            "RLP parent nodes must not be zero."
        );

        bytes32 storageRoot = storageRoots[_blockHeight];

        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero."
        );

        MessageBus.Message storage message = messages[_messageHash];

        redeemer_ = message.sender;
        redeemAmount_ = redeems[_messageHash].amount;

        MessageBus.progressOutboxWithProof(
            messageBox,
            message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot,
            MessageBus.MessageStatus(_messageStatus)
        );

        (redeemer_, redeemAmount_) =
            progressRedeemInternal(_messageHash, message, true, bytes32(0));

    }

    /**
     * @notice Revert the redeem process. Only redeemer can
     *         revert redeem by providing penalty i.e. 1.5 times of
     *         bounty amount. On revert process, penalty and facilitator
     *         bounty will be burned.
     *
     * @param _messageHash Message hash.
     *
     * @return redeemer_ Redeemer address
     * @return redeemerNonce_ Redeemer nonce
     * @return amount_ Redeem amount
     */
    function revertRedeem(
        bytes32 _messageHash
    )
        payable
        external
        returns (
            address redeemer_,
            uint256 redeemerNonce_,
            uint256 amount_
        )
    {
        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero."
        );

        // Get the message object for the _messageHash.
        MessageBus.Message storage message = messages[_messageHash];

        require(
            message.sender == msg.sender,
            "Only redeemer can revert redeem."
        );

        // Penalty charged to redeemer.
        uint256 penalty = penaltyFromBounty(redeems[_messageHash].bounty);

        require(
            msg.value == penalty,
            "msg.value must match the penalty amount."
        );

        // Declare redeem revocation.
        MessageBus.declareRevocationMessage(
            messageBox,
            message
        );

        redeemer_ = message.sender;
        redeemerNonce_ = message.nonce;
        amount_ = redeems[_messageHash].amount;

        emit RevertRedeemDeclared(
            _messageHash,
            redeemer_,
            redeemerNonce_,
            amount_
        );
    }

    /**
     * @notice Complete revert redeem by providing the merkle proof.
     *         It will burn facilitator bounty and redeemer penalty.
     *
     * @param _messageHash Message hash.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent node data to prove
     *                        DeclaredRevocation in messageBox inbox of Gateway.
     *
     * @return redeemer_ Redeemer address
     * @return redeemerNonce_ Redeemer nonce
     * @return amount_ Redeem amount
     */
    function progressRevertRedeem(
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
            "RedeemIntentHash must not be zero"
        );

        // Get the storageRoot for the given block height.
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        // Progress with revocation message.
        MessageBus.progressOutboxRevocation(
            messageBox,
            message,
            MESSAGE_BOX_OFFSET,
            _rlpParentNodes,
            storageRoot,
            MessageBus.MessageStatus.Revoked
        );

        Redeem storage redeemProcess = redeems[_messageHash];

        redeemer_ = message.sender;
        redeemerNonce_ = message.nonce;
        amount_ = redeemProcess.amount;

        // Return the redeem amount back.
        EIP20Interface(utilityToken).transfer(message.sender, amount_);

        // Burn bounty.
        burner.transfer(redeemProcess.bounty);

        // Penalty charged to redeemer.
        uint256 penalty = penaltyFromBounty(redeemProcess.bounty);

        // Burn penalty.
        burner.transfer(penalty);

        // Delete the redeem data.
        delete redeems[_messageHash];

        emit RedeemReverted(
            _messageHash,
            message.sender,
            message.nonce,
            redeemProcess.amount
        );
    }

    /**
     * @notice Confirms the initiation of the stake process.
     *
     * @param _staker Staker address.
     * @param _stakerNonce Nonce of the staker address.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted. This is payable so that it
     *                     provides flexibility of transferring base token
     *                     to account on minting.
     * @param _amount Staked amount.
     * @param _gasPrice Gas price that staker is ready to pay to get the stake
     *                  and mint process done
     * @param _gasLimit Gas limit that staker is ready to pay
     * @param _hashLock Hash Lock provided by the facilitator.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent node data to prove in
     *                        messageBox outbox of Gateway
     *
     * @return messageHash_ which is unique for each request.
     */
    function confirmStakeIntent(
        address _staker,
        uint256 _stakerNonce,
        address payable _beneficiary,
        uint256 _amount,
        uint256 _gasPrice,
        uint256 _gasLimit,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes calldata _rlpParentNodes
    )
        external
        returns (bytes32 messageHash_)
    {
        // Get the initial gas amount.
        uint256 initialGas = gasleft();

        require(
            _staker != address(0),
            "Staker address must not be zero."
        );
        require(
            _beneficiary != address(0),
            "Beneficiary address must not be zero."
        );
        require(
            _amount != 0,
            "Stake amount must not be zero."
        );
        require(
            _rlpParentNodes.length != 0,
            "RLP parent nodes must not be zero."
        );

        bytes32 intentHash = hashStakeIntent(
            _amount,
            _beneficiary
        );
        
        MessageBus.Message memory message = MessageBus.Message(
            intentHash,
            _stakerNonce,
            _gasPrice,
            _gasLimit,
            _staker,
            _hashLock,
            0 // Gas consumed will be updated at the end of this function.
        );

        messageHash_ = storeMessage(message);
        registerInboxProcess(
            message.sender,
            message.nonce,
            messageHash_
        );

        // Create new mint object.
        mints[messageHash_] = Mint({
            amount : _amount,
            beneficiary : _beneficiary
        });

        /*
         * Execute the confirm stake intent. This is done in separate
         * function to avoid stack too deep error
         */
        confirmStakeIntentInternal(
            messages[messageHash_],
            _blockHeight,
            _rlpParentNodes
        );

        // Emit StakeIntentConfirmed event.
        emit StakeIntentConfirmed(
            messageHash_,
            _staker,
            _stakerNonce,
            _beneficiary,
            _amount,
            _blockHeight,
            _hashLock
        );

        // Update the gas consumed for this function.
        messages[messageHash_].gasConsumed = initialGas.sub(gasleft());
    }

    /**
     * @notice Initiates the redeem process.
     *
     * @dev In order to redeem the redeemer needs to approve CoGateway contract
     *      for redeem amount. Redeem amount is transferred from redeemer
     *      address to CoGateway contract.
     *      This is a payable function. The bounty is transferred in base token.
     *      Redeemer is always msg.sender.
     *
     * @param _amount Redeem amount that will be transferred from redeemer
     *                account.
     * @param _beneficiary The address in the origin chain where the value
     *                     tok ens will be released.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the
     *                  redeem process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay.
     * @param _nonce Nonce of the redeemer address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ Unique for each request.
     */
    function redeem(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
        external
        payable
        returns (bytes32 messageHash_)
    {
        require(
            msg.value == bounty,
            "Payable amount should be equal to the bounty amount."
        );

        require(
            _amount > uint256(0),
            "Redeem amount must not be zero."
        );

        /*
         * Maximum reward possible is _gasPrice * _gasLimit, we check this
         * upfront in this function to make sure that after unstake of the
         * tokens it is possible to give the reward to the facilitator.
         */
        require(
            _amount > _gasPrice.mul(_gasLimit),
            "Maximum possible reward must be less than the redeem amount."
        );

        // Get the redeem intent hash.
        bytes32 intentHash = GatewayLib.hashRedeemIntent(
            _amount,
            _beneficiary,
            address(this)
        );

        MessageBus.Message memory message = getMessage(
            intentHash,
            _nonce,
            _gasPrice,
            _gasLimit,
            msg.sender,
            _hashLock
        );

        messageHash_ = storeMessage(message);

        registerOutboxProcess(
            msg.sender,
            _nonce,
            messageHash_
        );

        redeems[messageHash_] = Redeem({
            amount : _amount,
            beneficiary : _beneficiary,
            bounty : bounty
        });

        // Declare message in outbox.
        MessageBus.declareMessage(
            messageBox,
            messages[messageHash_]
        );

        // Transfer redeem amount to Co-Gateway.
        EIP20Interface(utilityToken).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        // Emit RedeemIntentDeclared event.
        emit RedeemIntentDeclared(
            messageHash_,
            msg.sender,
            _nonce,
            _beneficiary,
            _amount
        );
    }

    /**
     * @notice Gets the penalty amount. If the message hash does not exist in
     *         redeems mapping it will return zero amount. If the message is
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
        penalty_ = super.penaltyFromBounty(redeems[_messageHash].bounty);
    }


    /* Private functions */

    /**
     * @notice private function to execute confirm stake intent.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmStakeIntent function
     *
     * @param _message message object
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent nodes.
     *
     * @return `true` if executed successfully
     */
    function confirmStakeIntentInternal(
        MessageBus.Message storage _message,
        uint256 _blockHeight,
        bytes memory _rlpParentNodes
    )
        private
        returns (bool)
    {
        // Get storage root.
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        // Confirm message.
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
     * @notice private function to calculate stake intent hash.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmStakeIntent function
     *
     * @param _amount stake amount
     * @param _beneficiary minting account
     *
     * @return bytes32 stake intent hash
     */
    function hashStakeIntent(
        uint256 _amount,
        address _beneficiary
    )
        private
        view
        returns(bytes32)
    {
        return GatewayLib.hashStakeIntent(
            _amount,
            _beneficiary,
            remoteGateway
        );
    }

    /**
     * @notice This is internal method for process minting contains common logic.
     *         It doesn't mint reward if reward is 0.
     *
     * @param _messageHash Message hash.
     * @param _initialGas Initial gas during progress process.
     *
     * @param _proofProgress `true` if progress with proof, false if progress
     *                       with hashlock.
     * @param _unlockSecret Unlock secret to progress, zero in case of progress
     *                      with proof.
     *
     * @return  beneficiary_ Address to which the utility tokens will be
     *                      transferred after minting.
     * @return stakeAmount_ Total amount for which the stake was initiated. The
     *                      reward amount is deducted from the total amount and
     *                      is given to the facilitator.
     * @return mintedAmount_ Actual minted amount, after deducting the reward
     *                        from the total amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator.
     */
    function progressMintInternal(
        bytes32 _messageHash,
        uint256 _initialGas,
        bool _proofProgress,
        bytes32 _unlockSecret
    )
        private
        returns (
            address beneficiary_,
            uint256 stakeAmount_,
            uint256 mintedAmount_,
            uint256 rewardAmount_
        )
    {
        Mint storage mint = mints[_messageHash];
        MessageBus.Message storage message = messages[_messageHash];

        beneficiary_ = mint.beneficiary;
        stakeAmount_ = mint.amount;

        (rewardAmount_, message.gasConsumed) = feeAmount(
            message.gasConsumed,
            message.gasLimit,
            message.gasPrice,
            _initialGas
        );

        require(
            rewardAmount_ <= stakeAmount_,
            "Reward amount must not be greater than the stake amount."
        );

        mintedAmount_ = stakeAmount_.sub(rewardAmount_);

        // Mint token after subtracting reward amount.
        UtilityTokenInterface(utilityToken).increaseSupply(
            mint.beneficiary,
            mintedAmount_
        );

        if(rewardAmount_ > 0) {
            // Reward beneficiary with the reward amount.
            UtilityTokenInterface(utilityToken).increaseSupply(
                msg.sender,
                rewardAmount_
            );
        }

        // Delete the mint data.
        delete mints[_messageHash];

        // Emit MintProgressed event.
        emit MintProgressed(
            _messageHash,
            message.sender,
            mint.beneficiary,
            stakeAmount_,
            mintedAmount_,
            rewardAmount_,
            _proofProgress,
            _unlockSecret
        );

    }

    /**
     * @notice Internal method for progressRedeem. This is created to share
     *         code between progressRedeem and progressRedeemWithProof.
     *
     * @param _messageHash Message hash of redeem message.
     * @param _proofProgress True if progress with proof, false if progress
     *                       with hashlock.
     * @param _unlockSecret Unlock secret to progress, zero in case of progress
     *                      with proof.
     *
     * @return redeemer_ Redeemer address.
     * @return redeemAmount_ Redeem amount.
     */
    function progressRedeemInternal(
        bytes32 _messageHash,
        MessageBus.Message storage _message,
        bool _proofProgress,
        bytes32 _unlockSecret
    )
        private
        returns (
            address redeemer_,
            uint256 redeemAmount_
        )
    {
        redeemer_ = _message.sender;
        redeemAmount_ = redeems[_messageHash].amount;

        // Decrease the token supply.
        UtilityTokenInterface(utilityToken).decreaseSupply(redeemAmount_);

        // Transfer the bounty amount to the facilitator.
        msg.sender.transfer(redeems[_messageHash].bounty);

        // Delete the redeem data.
        delete redeems[_messageHash];

        emit RedeemProgressed(
            _messageHash,
            redeemer_,
            _message.nonce,
            redeemAmount_,
            _proofProgress,
            _unlockSecret
        );

    }

}
