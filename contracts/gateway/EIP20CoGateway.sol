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

/*

                Origin chain      |       Auxiliary chain
-------------------------------------------------------------------------------
                Gateway - - - - - - - - - - - CoGateway
-------------------------------------------------------------------------------
1. GatewayLinking:

            initiateGatewayLink  --->   confirmGatewayLinkIntent
                 |
            progressGatewayLink  --->   progressGatewayLink
-------------------------------------------------------------------------------
2. Redeem and Unstake: Normal flow

        confirmRedemptionIntent  <---   redeem
                                           |
        progressUnstake (HL)     --->   progressRedemption (HL)
-------------------------------------------------------------------------------
3. Redeem and Unstake (Revert): Normal flow

        confirmRedemptionIntent   <---   redeem
                                            |
RevertRedemptionIntentConfirmed   --->   revertRedemption
            |
    progressRevertRedemption      --->   progressRevertRedemption
-------------------------------------------------------------------------------
4.  Redeem and Unstake: Incase the facilitator is not able to progress

        confirmRedemptionIntent   <---   redeem
        (by facilitator)                 (by facilitator)
                                    |
                            facilitator (offline)
                                            |
        progressUnstakeWithProof  <---   progressRedemptionWithProof
-------------------------------------------------------------------------------
*/

import "./CoGateway.sol";

/**
 * @title CoGateway Contract
 *
 * @notice CoGateway act as medium to send messages from auxiliary chain to
 *         origin chain. Currently CoGateway supports redeem and unstake,
 *         revert redeem message & linking of gateway and cogateway.
 */
contract EIP20CoGateway is CoGateway {

    /* Events */

    /** Emitted whenever a staking intent is confirmed. */
    event StakingIntentConfirmed(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _blockHeight,
        bytes32 _hashLock
    );

    /** Emitted whenever a utility tokens are minted. */
    event ProgressedMint(
        bytes32 indexed _messageHash,
        address _staker,
        address _beneficiary,
        uint256 _stakeAmount,
        uint256 _mintedAmount,
        uint256 _rewardAmount,
        bytes32 _unlockSecret
    );

    /** Emitted whenever revert staking intent is confirmed. */
    event RevertStakingIntentConfirmed(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        uint256 _amount
    );

    /** Emitted whenever a staking intent is reverted. */
    event RevertStakeProgressed(
        bytes32 indexed _messageHash,
        address _staker,
        uint256 _stakerNonce,
        uint256 _amount
    );

    /** Emitted whenever redemption is initiated. */
    event RedemptionIntentDeclared(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        address _beneficiary,
        uint256 _amount
    );

    /** Emitted whenever redemption is completed. */
    event ProgressedRedemption(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount,
        bytes32 _unlockSecret
    );

    /** Emitted whenever revert redemption is initiated. */
    event RevertRedemptionDeclared(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount
    );

    /** Emitted whenever revert redemption is complete. */
    event RevertedRedemption(
        bytes32 indexed _messageHash,
        address _redeemer,
        uint256 _redeemerNonce,
        uint256 _amount
    );

    /* Struct */

    /**
     * Redeem stores the redemption information about the redeem amount,
     * beneficiary address, message data and facilitator address.
     */
    struct Redeem {

        /** Amount that will be redeemed. */
        uint256 amount;

        /**
         * Address where the value tokens will be unstaked in the
         * origin chain.
         */
        address beneficiary;

        /** Address of the facilitator that initiates the staking process. */
        address facilitator;
        /** bounty amount kept by facilitator for transferring redeem messages*/
        uint256 bounty;
    }

    /**
     * Mint stores the minting information
     * like mint amount, beneficiary address, message data.
     */
    struct Mint {

        /** Amount that will be minted. */
        uint256 amount;

        /** Address for which the utility tokens will be minted */
        address beneficiary;
    }

    /* public variables */

    /** Maps messageHash to the Mint object. */
    mapping(bytes32 /*messageHash*/ => Mint) mints;

    /** Maps messageHash to the Redeem object. */
    mapping(bytes32/*messageHash*/ => Redeem) redeems;

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
     * @param _messageBus Message bus contract address.
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
    CoGateway(_valueToken, _utilityToken, _core, _bounty, _organisation, _gateway, _messageBus)
    public
    {

    }

    /* External functions */

    /**
     * @notice Confirms the initiation of the stake process.
     *
     * @param _staker Staker address.
     * @param _stakerNonce Nonce of the staker address.
     * @param _beneficiary The address in the auxiliary chain where the utility
     *                     tokens will be minted.
     * @param _amount Amount of utility token will be minted.
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
    function confirmStakingIntent(
        address _staker,
        uint256 _stakerNonce,
        address _beneficiary,
        uint256 _amount,
        uint256 _gasPrice,
        uint256 _gasLimit,
        bytes32 _hashLock,
        uint256 _blockHeight,
        bytes memory _rlpParentNodes
    )
    public
    returns (bytes32 messageHash_)
    {
        // Get the initial gas amount
        uint256 initialGas = gasleft();

        require(
            _staker != address(0),
            "Staker address must not be zero"
        );
        require(
            _beneficiary != address(0),
            "Beneficiary address must not be zero"
        );
        require(
            _amount != 0,
            "Mint amount must not be zero"
        );
        require(
            _gasPrice != 0,
            "Gas price must not be zero"
        );
        require(
            _gasLimit != 0,
            "Gas limit must not be zero"
        );
        require(
            _hashLock != bytes32(0),
            "Hash lock must not be zero"
        );
        require(
            _rlpParentNodes.length != 0,
            "RLP parent nodes must not be zero"
        );

        // Get the staking intent hash
        bytes32 intentHash = hashStakingIntent(
            _amount,
            _beneficiary,
            _staker,
            _stakerNonce,
            _gasPrice,
            _gasLimit
        );

        // Get the messageHash
        messageHash_ = MessageBus.messageDigest(
            STAKE_TYPEHASH,
            intentHash,
            _stakerNonce,
            _gasPrice,
            _gasLimit
        );

        // Get previousMessageHash
        bytes32 previousMessageHash = initiateNewProcess(
            _staker,
            _stakerNonce,
            messageHash_,
            MessageBus.MessageBoxType.Inbox
        );

        // Delete the previous progressed / revoked mint data
        delete mints[previousMessageHash];

        // Create new mint object
        mints[messageHash_] = Mint({
            amount : _amount,
            beneficiary : _beneficiary
            });

        // create new message object
        messages[messageHash_] = getMessage(
            _staker,
            _stakerNonce,
            _gasPrice,
            _gasLimit,
            intentHash,
            _hashLock);


        // execute the confirm staking intent. This is done in separate
        // function to avoid stack too deep error
        executeConfirmStakingIntent(
            messages[messageHash_],
            _blockHeight,
            _rlpParentNodes
        );

        // Emit StakingIntentConfirmed event
        emit StakingIntentConfirmed(
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
     * @notice Complete minting process by minting the utility tokens
     *
     * @param _messageHash Message hash.
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      facilitator while initiating the stake
     *
     * @return staker_ Staker address
     * @return beneficiary_ Address to which the utility tokens will be
     *                      transferred after minting
     * @return stakeAmount_ Total amount for which the staking was
     *                      initiated. The reward amount is deducted from the
     *                      this amount and is given to the facilitator.
     * @return mintedAmount_ Actual minted amount, after deducting the reward
     *                       from the total (stake) amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator
     */
    function progressMinting(
        bytes32 _messageHash,
        bytes32 _unlockSecret
    )
    external
    returns (
        address staker_,
        address beneficiary_,
        uint256 stakeAmount_,
        uint256 mintedAmount_,
        uint256 rewardAmount_
    )
    {
        // Get the initial gas amount
        uint256 initialGas = gasleft();

        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero"
        );
        require(
            _unlockSecret != bytes32(0),
            "Unlock secret must not be zero"
        );

        Mint storage mint = mints[_messageHash];
        MessageBus.Message storage message = messages[_messageHash];

        // Progress inbox
        MessageBus.progressInbox(
            messageBox,
            STAKE_TYPEHASH,
            message,
            _unlockSecret
        );

        staker_ = message.sender;
        beneficiary_ = mint.beneficiary;
        stakeAmount_ = mint.amount;

        (rewardAmount_, message.gasConsumed) = GatewayLib.feeAmount(
            message.gasConsumed,
            message.gasLimit,
            message.gasPrice,
            initialGas,
            50000  //21000 * 2 for transactions + approx buffer
        );

        mintedAmount_ = stakeAmount_.sub(rewardAmount_);

        //Mint token after subtracting reward amount
        UtilityTokenInterface(utilityToken).mint(beneficiary_, mintedAmount_);

        //reward beneficiary with the reward amount
        UtilityTokenInterface(utilityToken).mint(msg.sender, rewardAmount_);

        // delete the mint data
        delete mints[_messageHash];

        // Emit ProgressedMint event
        emit ProgressedMint(
            _messageHash,
            message.sender,
            mint.beneficiary,
            stakeAmount_,
            mintedAmount_,
            rewardAmount_,
            _unlockSecret
        );
    }

    /**
     * @notice Completes the minting process by providing the merkle proof
     *         instead of unlockSecret. In case the facilitator process is not
     *         able to complete the stake and minting process then this is an
     *         alternative approach to complete the process
     *
     * @dev This can be called to prove that the outbox status of messageBox on
     *      Gateway is either declared or progressed.
     *
     * @param _messageHash Message hash.
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
     *                               messageBox inbox of Gateway
     * @param _blockHeight Block number for which the proof is valid
     * @param _messageStatus Message status i.e. Declared or Progressed that
     *                       will be proved.
     *
     * @return stakeAmount_ Total amount for which the stake was initiated. The
     *                      reward amount is deducted from the total amount and
     *                      is given to the facilitator.
     * @return mintedAmount_ Actual minted amount, after deducting the reward
     *                        from the total amount.
     * @return rewardAmount_ Reward amount that is transferred to facilitator
     */
    function progressMintingWithProof(
        bytes32 _messageHash,
        bytes _rlpEncodedParentNodes,
        uint256 _blockHeight,
        uint256 _messageStatus
    )
    public
    returns (
        uint256 stakeAmount_,
        uint256 mintedAmount_,
        uint256 rewardAmount_
    )
    {
        // Get the inital gas
        uint256 initialGas = gasleft();

        require(
            _messageHash != bytes32(0),
            "Message hash must not be zero"
        );
        require(
            _rlpEncodedParentNodes.length > 0,
            "RLP encoded parent nodes must not be zero"
        );

        // Get the storage root for the given block height
        bytes32 storageRoot = storageRoots[_blockHeight];
        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        Mint storage mint = mints[_messageHash];
        MessageBus.Message storage message = messages[_messageHash];

        MessageBus.progressInboxWithProof(
            messageBox,
            STAKE_TYPEHASH,
            message,
            _rlpEncodedParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot,
            MessageBus.MessageStatus(_messageStatus)
        );

        stakeAmount_ = mint.amount;

        //TODO: Remove the hardcoded 50000. Discuss and implement it properly
        //21000 * 2 for transactions + approx buffer
        (rewardAmount_, message.gasConsumed) = GatewayLib.feeAmount(
            message.gasConsumed,
            message.gasLimit,
            message.gasPrice,
            initialGas,
            50000
        );

        mintedAmount_ = stakeAmount_.sub(rewardAmount_);

        //Mint token after subtracting reward amount
        UtilityTokenInterface(utilityToken).mint(mint.beneficiary, mintedAmount_);

        //reward beneficiary with the reward amount
        UtilityTokenInterface(utilityToken).mint(msg.sender, rewardAmount_);

        // delete the mint data
        delete mints[_messageHash];

        //TODO: we can have a separate event for this.
        // Emit ProgressedMint event
        emit ProgressedMint(
            _messageHash,
            message.sender,
            mint.beneficiary,
            stakeAmount_,
            mintedAmount_,
            rewardAmount_,
            bytes32(0)
        );
    }

    /**
     * @notice Declare staking revert intent
     *
     * @param _messageHash Message hash.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove
     *                               DeclaredRevocation in messageBox outbox
     *                               of Gateway
     *
     * @return staker_ Staker address
     * @return stakerNonce_ Staker nonce
     * @return amount_ Redeem amount
     */
    function confirmRevertStakingIntent(
        bytes32 _messageHash,
        uint256 _blockHeight,
        bytes _rlpEncodedParentNodes
    )
    external
    returns (
        address staker_,
        uint256 stakerNonce_,
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
            _rlpEncodedParentNodes.length > 0,
            "RLP encoded parent nodes must not be zero"
        );

        MessageBus.Message storage message = messages[_messageHash];
        require(
            message.intentHash != bytes32(0),
            "RevertRedemption intent hash must not be zero"
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
            STAKE_TYPEHASH,
            message,
            _rlpEncodedParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot
        );

        Mint storage mint = mints[_messageHash];

        staker_ = message.sender;
        stakerNonce_ = message.nonce;
        amount_ = mint.amount;

        // Emit RevertStakingIntentConfirmed event
        emit RevertStakingIntentConfirmed(
            _messageHash,
            message.sender,
            message.nonce,
            mint.amount
        );

        // Update the gas consumed for this function.
        message.gasConsumed = initialGas.sub(gasleft());
    }

    //TODO: Discuss this with team. We may not need this at all.
    /**
     * @notice Complete revert staking by providing the merkle proof
     *
     * @param _messageHash Message hash.
     *
     * @return staker_ Staker address
     * @return stakerNonce_ Staker nonce
     * @return amount_ Stake amount
     */
    function progressRevertStaking(
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
            "Message hash must not be zero"
        );

        // Get the message object
        MessageBus.Message storage message = messages[_messageHash];
        require(
            message.intentHash != bytes32(0),
            "StakingIntentHash must not be zero"
        );

        // TODO: @dev should we directly change the status ?
        bool isChanged = false;
        MessageBus.MessageStatus nextStatus;
        (isChanged, nextStatus) = MessageBus.changeInboxState(
            messageBox,
            _messageHash
        );

        require(isChanged == true,
            "MessageBox state must change"
        );

        require(nextStatus == MessageBus.MessageStatus.Revoked,
            "Next status must be Revoked"
        );

        staker_ = message.sender;
        stakerNonce_ = message.nonce;
        amount_ = mints[_messageHash].amount;

        // delete the mint data
        delete mints[_messageHash];

        // Emit RevertStakeProgressed event
        emit RevertStakeProgressed(
            _messageHash,
            staker_,
            stakerNonce_,
            amount_
        );
    }

    /**
     * @notice Initiates the redemption process.
     *
     * @dev In order to redeem the redeemer needs to approve CoGateway contract
     *      for redeem amount. Redeem amount is transferred from redeemer
     *      address to CoGateway contract.
     *      This is a payable function. The bounty is transferred in base token
     *      Redeemer is always msg.sender
     *
     * @param _amount Redeem amount that will be transferred form redeemer
     *                account.
     * @param _beneficiary The address in the origin chain where the value
     *                     tok ens will be released.
     * @param _facilitator Facilitator address.
     * @param _gasPrice Gas price that redeemer is ready to pay to get the
     *                  redemption process done.
     * @param _gasLimit Gas limit that redeemer is ready to pay
     * @param _nonce Nonce of the redeemer address.
     * @param _hashLock Hash Lock provided by the facilitator.
     *
     * @return messageHash_ which is unique for each request.
     */
    function redeem(
        uint256 _amount,
        address _beneficiary,
        address _facilitator,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 _hashLock
    )
    public
    payable
    isActive
    returns (bytes32 messageHash_)
    {
        require(
            msg.value == bounty,
            "msg.value must match the bounty amount"
        );
        require(
            _amount > uint256(0),
            "Redeem amount must not be zero"
        );

        //TODO: This check will be removed so that tokens can be burnt.
        //      Discuss and verify all the cases
        require(
            _beneficiary != address(0),
            "Beneficiary address must not be zero"
        );
        require(
            _facilitator != address(0),
            "Facilitator address must not be zero"
        );
        require(
            _gasPrice != 0,
            "Gas price must not be zero"
        );
        require(
            _gasLimit != 0,
            "Gas limit must not be zero"
        );

        //TODO: Do we need this check ?
        require(
            _hashLock != bytes32(0),
            "HashLock must not be zero"
        );

        // Get the redemption intent hash
        bytes32 intentHash = GatewayLib.hashRedemptionIntent(
            _amount,
            _beneficiary,
            msg.sender,
            _nonce,
            _gasPrice,
            _gasLimit,
            valueToken
        );

        // Get the messageHash
        messageHash_ = MessageBus.messageDigest(
            REDEEM_TYPEHASH,
            intentHash,
            _nonce,
            _gasPrice,
            _gasLimit
        );

        // Get previousMessageHash
        bytes32 previousMessageHash = initiateNewProcess(
            msg.sender,
            _nonce,
            messageHash_,
            MessageBus.MessageBoxType.Outbox
        );

        // Delete the previous progressed/revoked redeem data
        delete redeems[previousMessageHash];

        redeems[messageHash_] = Redeem({
            amount : _amount,
            beneficiary : _beneficiary,
            facilitator : _facilitator,
            bounty : bounty
            });

        // create message object
        messages[messageHash_] = getMessage(
            msg.sender,
            _nonce,
            _gasPrice,
            _gasLimit,
            intentHash,
            _hashLock
        );

        //TODO: Move this code in MessageBus.
        require(
            messageBox.outbox[messageHash_] ==
            MessageBus.MessageStatus.Undeclared,
            "Message status must be Undeclared"
        );
        // Update the message outbox status to declared.
        messageBox.outbox[messageHash_] = MessageBus.MessageStatus.Declared;

        //transfer redeem amount to Co-Gateway
        EIP20Interface(utilityToken).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        // Emit RedemptionIntentDeclared event
        emit RedemptionIntentDeclared(
            messageHash_,
            msg.sender,
            _nonce,
            _beneficiary,
            _amount
        );
    }

    /**
     * @notice Completes the redemption process.
     *
     * @param _messageHash Message hash.
     * @param _unlockSecret Unlock secret for the hashLock provide by the
     *                      facilitator while initiating the redeem
     *
     * @return redeemer_ Redeemer address
     * @return redeemAmount_ Redeem amount
     */
    function progressRedemption(
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
            "Message hash must not be zero"
        );
        //TODO: unlock secret can be zero. Discuss if this check is needed.
        require(
            _unlockSecret != bytes32(0),
            "Unlock secret must not be zero"
        );

        // Get the message object
        MessageBus.Message storage message = messages[_messageHash];

        // Get the redeemer address
        redeemer_ = message.sender;

        // Get the redeem amount
        redeemAmount_ = redeems[_messageHash].amount;

        // Progress outbox
        MessageBus.progressOutbox(
            messageBox,
            REDEEM_TYPEHASH,
            message,
            _unlockSecret
        );

        // burn the redeem amount
        UtilityTokenInterface(utilityToken).burn(address(this), redeemAmount_);

        // Transfer the bounty amount to the facilitator
        msg.sender.transfer(redeems[_messageHash].bounty);

        // delete the redeem data
        delete redeems[_messageHash];

        // Emit ProgressedRedemption event.
        emit ProgressedRedemption(
            _messageHash,
            message.sender,
            message.nonce,
            redeemAmount_,
            _unlockSecret
        );
    }

    /**
     * @notice Completes the redemption process by providing the merkle proof
     *         instead of unlockSecret. In case the facilitator process is not
     *         able to complete the redeem and unstake process then this is an
     *         alternative approach to complete the process
     *
     * @dev This can be called to prove that the inbox status of messageBox on
     *      Gateway is either declared or progressed.
     *
     * @param _messageHash Message hash.
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove in
     *                               messageBox outbox of Gateway
     * @param _blockHeight Block number for which the proof is valid
     * @param _messageStatus Message status i.e. Declared or Progressed that
     *                       will be proved.
     *
     * @return redeemer_ Redeemer address
     * @return redeemAmount_ Redeem amount
     */
    function progressRedemptionWithProof(
        bytes32 _messageHash,
        bytes _rlpEncodedParentNodes,
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
            "Message hash must not be zero"
        );
        require(
            _rlpEncodedParentNodes.length > 0,
            "RLP encoded parent nodes must not be zero"
        );

        bytes32 storageRoot = storageRoots[_blockHeight];

        require(
            storageRoot != bytes32(0),
            "Storage root must not be zero"
        );

        MessageBus.Message storage message = messages[_messageHash];

        redeemer_ = message.sender;
        redeemAmount_ = redeems[_messageHash].amount;

        MessageBus.progressOutboxWithProof(
            messageBox,
            REDEEM_TYPEHASH,
            message,
            _rlpEncodedParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot,
            MessageBus.MessageStatus(_messageStatus)
        );

        // Burn the redeem amount.
        UtilityTokenInterface(utilityToken).burn(address(this), redeemAmount_);

        // Transfer the bounty amount to the facilitator
        msg.sender.transfer(redeems[_messageHash].bounty);

        // delete the redeem data
        delete redeems[_messageHash];

        //TODO: we can have a seperate event for this.
        // Emit ProgressedRedemption event.
        emit ProgressedRedemption(
            _messageHash,
            redeemer_,
            message.nonce,
            redeemAmount_,
            bytes32(0)
        );
    }

    /**
     * @notice Revert redemption to stop the redeem process
     *
     * @param _messageHash Message hash.
     *
     * @return redeemer_ Redeemer address
     * @return redeemerNonce_ Redeemer nonce
     * @return amount_ Redeem amount
     */
    function revertRedemption(
        bytes32 _messageHash
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

        // get the message object for the _messageHash
        MessageBus.Message storage message = messages[_messageHash];

        require(message.intentHash != bytes32(0));

        require(
            message.intentHash != bytes32(0),
            "RedemptionIntentHash must not be zero"
        );

        require(
            message.sender == msg.sender,
            "msg.sender must match"
        );

        //TODO: Move this code in MessageBus. Should we use changeOutboxState?
        require(
            messageBox.outbox[_messageHash] ==
            MessageBus.MessageStatus.Undeclared,
            "Message status must be Undeclared"
        );
        // Update the message outbox status to declared.
        messageBox.outbox[_messageHash] =
        MessageBus.MessageStatus.DeclaredRevocation;

        redeemer_ = message.sender;
        redeemerNonce_ = message.nonce;
        amount_ = redeems[_messageHash].amount;

        // Emit RevertRedemptionDeclared event.
        emit RevertRedemptionDeclared(
            _messageHash,
            redeemer_,
            redeemerNonce_,
            amount_
        );
    }

    /**
     * @notice Complete revert redemption by providing the merkle proof
     *
     * @param _messageHash Message hash.
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpEncodedParentNodes RLP encoded parent node data to prove
     *                               DeclaredRevocation in messageBox inbox
     *                               of Gateway
     *
     * @return redeemer_ Redeemer address
     * @return redeemerNonce_ Redeemer nonce
     * @return amount_ Redeem amount
     */
    function progressRevertRedemption(
        bytes32 _messageHash,
        uint256 _blockHeight,
        bytes _rlpEncodedParentNodes
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
            _rlpEncodedParentNodes.length > 0,
            "RLP encoded parent nodes must not be zero"
        );

        // Get the message object
        MessageBus.Message storage message = messages[_messageHash];
        require(
            message.intentHash != bytes32(0),
            "StakingIntentHash must not be zero"
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
            REDEEM_TYPEHASH,
            MESSAGE_BOX_OFFSET,
            _rlpEncodedParentNodes,
            storageRoot,
            MessageBus.MessageStatus.Revoked
        );

        Redeem storage redeemData = redeems[_messageHash];

        redeemer_ = message.sender;
        redeemerNonce_ = message.nonce;
        amount_ = redeemData.amount;

        // return the redeem amount back
        EIP20Interface(utilityToken).transfer(message.sender, amount_);

        // transfer the bounty to msg.sender
        msg.sender.transfer(bounty);

        // delete the redeem data
        delete redeems[_messageHash];

        // Emit RevertedRedemption event
        emit RevertedRedemption(
            _messageHash,
            message.sender,
            message.nonce,
            redeemData.amount
        );
    }

    /**
     * @notice Activate CoGateway contract. Can be set only by the
     *         Organisation address
     *
     * @return `true` if value is set
     */
    function activateCoGateway()
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
     * @notice Deactivate CoGateway contract. Can be set only by the
     *         Organisation address
     *
     * @return `true` if value is set
     */
    function deactivateCoGateway()
    external
    onlyOrganisation
    returns (bool)
    {
        require(
            deactivated == false,
            "Gateway is already deactive"
        );
        deactivated = true;
        return true;
    }

    /* private methods */

    /**
     * @notice private function to execute confirm staking intent.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmStakingIntent function
     *
     * @param _message message object
     * @param _blockHeight Block number for which the proof is valid
     * @param _rlpParentNodes RLP encoded parent nodes.
     *
     * @return `true` if executed successfully
     */
    function executeConfirmStakingIntent(
        MessageBus.Message storage _message,
        uint256 _blockHeight,
        bytes _rlpParentNodes
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
            STAKE_TYPEHASH,
            _message,
            _rlpParentNodes,
            MESSAGE_BOX_OFFSET,
            storageRoot
        );

        return true;
    }

    /**
     * @notice private function to calculate staking intent hash.
     *
     * @dev This function is to avoid stack too deep error in
     *      confirmStakingIntent function
     *
     * @param _amount staking amount
     * @param _beneficiary minting account
     * @param _staker staking account
     * @param _stakerNonce nounce of staker
     * @param _gasPrice price used for reward calculation
     * @param _gasLimit max limit for reward calculation
     *
     * @return bytes32 staking intent hash
     */
    function hashStakingIntent(
        uint256 _amount,
        address _beneficiary,
        address _staker,
        uint256 _stakerNonce,
        uint256 _gasPrice,
        uint256 _gasLimit
    )
    private
    view
    returns(bytes32)
    {
        return GatewayLib.hashStakingIntent(
            _amount,
            _beneficiary,
            _staker,
            _stakerNonce,
            _gasPrice,
            _gasLimit,
            valueToken
        );
    }


}