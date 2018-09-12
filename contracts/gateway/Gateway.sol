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
// Value Chain: Gateway Contract
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


import "./EIP20Interface.sol";
import "./MessageBus.sol";
import "./CoreInterface.sol";
import "./SimpleStake.sol";
import "./SafeMath.sol";
import "./Hasher.sol";
import "./ProofLib.sol";
import "./RLP.sol";

/**
 * @title Gateway Contract
 *
 *  @notice Gateway contract is staking Gateway that separates the concerns of staker and staking processor.
 *          Stake process is executed through Gateway contract rather than directly with the protocol contract.
 *          The Gateway contract will serve the role of staking account rather than an external account.
 *
 */
contract Gateway is Hasher {

	using SafeMath for uint256;

	/* Events */

	event  StakingIntentDeclared(
		bytes32 _messageHash,
		uint256 _amount,
		address _beneficiary,
		address _staker,
		bytes32 _intentHash
	);

	event ProgressedStake(
		bytes32 _messageHash,
		uint256 _amount,
		address _beneficiary
	);

	event RevertStakeDeclared(
		bytes32 messageHash,
		address staker,
		bytes32 intentHash,
		uint256 nonce,
		uint256 gasPrice
	);

	event RevertedStake(
		address staker,
		uint256 amount,
		address beneficiary,
		uint256 gasPrice
	);

	event RedemptionIntentConfirmed(
		bytes32 messageHash,
		address redeemer,
		uint256 redeemerNonce,
		address beneficiary,
		uint256 amount,
		uint256 blockHeight,
		bytes32 hashLock
	);

	event ProgressedUnstake(
		bytes32 messageHash,
		uint256 amount,
		address beneficiary,
		uint256 reward
	);

	event RevertRedemptionIntentConfirmed(
		bytes32 messageHash,
		address redeemer,
		uint256 redeemerNonce,
		uint256 blockHeight
	);

	event GatewayLinkInitiated(
		bytes32 messageHash,
		address gateway,
		address cogateway,
		address token
	);
	/** wasAlreadyProved parameter differentiates between first call and replay call of proveOpenST method for same block height */
	event GatewayProven(
		uint256 blockHeight,
		bytes32 storageRoot,
		bool wasAlreadyProved
	);

	event GatewayLinkProgressed(
		bytes32 messageHash,
		address gateway,
		address cogateway,
		address token
	);

	/* Struct */
	/**
	 *  It denotes the stake.
	 *  Status values could be :-
	 *  0 :- amount used for staking
	 *  1 :- beneficiary is the address in the target chain where token will be minted.
	 */
	struct Stake {
		uint256 amount;
		address beneficiary;
		MessageBus.Message message;
		address facilitator;
	}

	struct Unstake {
		uint256 amount;
		address beneficiary;
		MessageBus.Message message;
	}

	struct GatewayLink {
		bytes32 messageHash;
		MessageBus.Message message;
	}

	/* Storage */

	address public coGateway;
	MessageBus.MessageBox messageBox;
	bool private linked;
	bool private deactivated;
	address public organisation;
	GatewayLink gatewayLink;

	//Escrow address to lock staked fund
	SimpleStake stakeVault;

	//amount in BT which is staked by facilitator
	uint256 public bounty;

	//address of branded token.
	EIP20Interface public token;

	//address of bounty token.
	EIP20Interface public bountyToken;


	//address of core contract.
	CoreInterface core;

	mapping(bytes32 /*messageHash*/ => Stake) stakes;
	mapping(address /*staker*/ => bytes32 /*messageHash*/) activeProcess;

	mapping(bytes32 /*messageHash*/ => Unstake) unstakes;

	/*mapping to store storage root with block height*/
	mapping(uint256 /* block height */ => bytes32) private storageRoots;
	/* path to prove merkle account proof for gateway  */
	bytes private encodedCoGatewayPath;

	//TODO: remove the GAS_LIMIT form constant. And get it along with gasPrice.
    uint256 constant GAS_LIMIT = 2000000; //TODO: Decide this later (May be we should have different gas limits. TO think)

	uint8 outboxOffset = 1;

	modifier onlyOrganisation() {
		require(msg.sender == organisation);
		_;
	}

	modifier isActive() {
		require(deactivated == false && linked == true);
		_;
	}

	/**
	 *  @notice Contract constructor.
	 *
	 *  @param _token Branded token contract address.
	 *  @param _bountyToken Contract address of ERC20 token for which the bounty will be transferred.
	 *  @param _core Core contract address.
	 *  @param _bounty Bounty amount that worker address stakes while accepting stake.
	 *  @param _organisation organisation address.
	 */
	constructor(
		EIP20Interface _token,
		EIP20Interface _bountyToken, //TODO: think of a better name
		CoreInterface _core,
		uint256 _bounty,
		address _organisation
	)
	public
	{
		require(_token != address(0));
		require(_core != address(0));
		require(_organisation != address(0));
		require(_bountyToken != address(0));

		linked = false;
		deactivated = false;
		token = _token;
		bountyToken = _bountyToken;
		core = _core;
		bounty = _bounty;
		organisation = _organisation;

		stakeVault = new SimpleStake(token, address(this));
	}

	/* Public functions */

	function initiateGatewayLink(
		address _coGateway,
		bytes32 _intentHash,
		uint256 _gasPrice,
		uint256 _nonce,
		address _sender,
		bytes32 _hashLock,
		bytes _signature)
	external
	returns (bytes32 messageHash_)
	{
		require(linked == false);
		require(_coGateway != address(0));
		require(_sender == organisation);
		require(gatewayLink.messageHash == bytes32(0));
		require(_nonce == _getNonce(_sender));

		coGateway = _coGateway;
		encodedCoGatewayPath = ProofLib.bytes32ToBytes(keccak256(abi.encodePacked(coGateway)));
        // TODO: need to add check for MessageBus.
		bytes32 intentHash = hashLinkGateway(
			address(this),
			coGateway,
			bounty,
			token.name(),
			token.symbol(),
			token.decimals(),
			_gasPrice,
			_nonce,
			token);

		require(intentHash == _intentHash);

		// check nonces
		messageHash_ = MessageBus.messageDigest(GATEWAY_LINK_TYPEHASH, intentHash, _nonce, _gasPrice);

		gatewayLink = GatewayLink ({
		 	messageHash: messageHash_,
			message:getMessage(
                _sender,
                _nonce,
                _gasPrice,
                _intentHash,
                _hashLock
            )
		});

		MessageBus.declareMessage(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _signature);

		emit GatewayLinkInitiated(
			messageHash_,
			address(this),
			coGateway,
			token
		);

	}

	// TODO: add isDeactivated

	// TODO: change the process to Progress
	function progressGatewayLink(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (bool /*TBD*/)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		require(gatewayLink.messageHash == _messageHash);

		MessageBus.progressOutbox(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _unlockSecret);

		linked = true;

		emit GatewayLinkProgressed(
			_messageHash,
			address(this),
			coGateway,
			token
		);
		return true;
	}

	/**
	 * @notice external function stake
	 *
	 * @dev In order to stake the staker needs to approve Gateway contract for stake amount.
     *   Staked amount is transferred from staker address to Gateway contract.
	 *
	 * @param _amount Staking amount.
	 * @param _beneficiary Beneficiary address.
	 * @param _staker Staker address.
	 * @param _gasPrice Gas price
	 * @param _nonce Staker nonce.
	 * @param _hashLock Hash Lock
	 * @param _signature Signature signed by staker.
	 *
	 * @return messageHash_ which is unique for each request.
	 */
	function stake(
		uint256 _amount,
		address _beneficiary,
		address _staker,
		uint256 _gasPrice,
		uint256 _nonce,
		bytes32 _hashLock,
		bytes _signature
	)
	external
	isActive
	returns (bytes32 messageHash_)
	{
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_staker != address(0));
		require(_hashLock != bytes32(0));
		require(_signature.length == 65); //TODO: check for the correct length (65).

		//TODO: include valueToken,
		bytes32 intentHash = hashStakingIntent(_amount, _beneficiary, _staker, _gasPrice, token);

		messageHash_ = MessageBus.messageDigest(STAKE_TYPEHASH, intentHash, _nonce, _gasPrice);

		bytes32 previousMessageHash = initiateNewInboxProcess(_staker, _nonce, messageHash_);
		delete stakes[previousMessageHash];

		// TODO: Check if we can merge  require(cleanProcessedStake(_staker)); , checking the nonce, and  activeProcess[_staker] = messageHash_;
		activeProcess[_staker] = messageHash_;

		stakes[messageHash_] = Stake({
			amount : _amount,
			beneficiary : _beneficiary,
			message : getMessage(_staker, _nonce, _gasPrice, intentHash, _hashLock),
			facilitator : msg.sender
			});

		MessageBus.declareMessage(messageBox, STAKE_TYPEHASH, stakes[messageHash_].message, _signature);
		//transfer staker amount to gateway
		require(token.transferFrom(_staker, address(this), _amount));

		// transfer the bounty amount // TODO: change the bounty transfer in BountyToken (Think for a name)
		require(bountyToken.transferFrom(msg.sender, address(this), bounty));

		emit StakingIntentDeclared(
			messageHash_,
			_amount,
			_beneficiary,
			_staker,
			intentHash
		);
	}

	function progressStaking(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (uint256 stakeAmount_)
	{
		//require(linked); //TODO: this is not required. put it only for stake, redeem (places we do declare)
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));
		MessageBus.Message storage message = stakes[_messageHash].message;

		stakeAmount_ = stakes[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, STAKE_TYPEHASH, message, _unlockSecret);

		require(token.transfer(stakeVault, stakeAmount_));

		//return bounty
		require(bountyToken.transfer(msg.sender, bounty));

		emit ProgressedStake(
			_messageHash,
			stakes[_messageHash].amount,
			stakes[_messageHash].beneficiary
		);
	}

	function progressStakingWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
	external
	returns (uint256 stakeAmount_)
	{
		//require(linked);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		stakeAmount_ = stakes[_messageHash].amount;

		bytes32 storageRoot = storageRoots[_blockHeight];
		require(storageRoot != bytes32(0));

		//staker has started the revocation and facilitator has processed on utility chain
		//staker has to process with proof
		MessageBus.progressOutboxWithProof(
			messageBox,
			STAKE_TYPEHASH,
			stakes[_messageHash].message,
			_rlpEncodedParentNodes,
			outboxOffset,
			storageRoot,
			MessageBus.MessageStatus(_messageStatus)
		);

		require(token.transfer(stakeVault, stakeAmount_));

		//todo discuss return bounty
		require(bountyToken.transfer(stakes[_messageHash].facilitator, bounty));

		emit ProgressedStake(
			_messageHash,
			stakes[_messageHash].amount,
			stakes[_messageHash].beneficiary
		);
	}

	function revertStaking(
		bytes32 _messageHash,
		bytes _signature
	)
	external
	returns (
		address staker_,
		bytes32 intentHash_,
		uint256 nonce_,
		uint256 gasPrice_
	)
	{
		//require(linked);
		require(_messageHash != bytes32(0));
		MessageBus.Message storage message = stakes[_messageHash].message;

		require(message.intentHash != bytes32(0));

		require(
			MessageBus.declareRevocationMessage(
			messageBox,
				STAKE_TYPEHASH,
			message,
				_signature
			)
		);

		staker_ = message.sender;
		intentHash_ = message.intentHash;
		gasPrice_ = message.gasPrice;
		nonce_ = message.nonce;
		emit RevertStakeDeclared(_messageHash, staker_, intentHash_, nonce_, gasPrice_);
	}

	function progressRevertStaking(
		bytes32 _messageHash,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes
	)
	external
	returns (bool /*TBD*/)
	{
		//require(linked);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		MessageBus.Message storage message = stakes[_messageHash].message;
		require(message.intentHash != bytes32(0));

		bytes32 storageRoot = storageRoots[_blockHeight];
		require(storageRoot != bytes32(0));

		require(
			MessageBus.progressRevocationMessage(
			messageBox,
			message,
			STAKE_TYPEHASH,
			outboxOffset,
			_rlpEncodedParentNodes,
				storageRoot
			)
		);

		Stake storage stakeData = stakes[_messageHash];

		require(token.transfer(message.sender, stakeData.amount));

		require(bountyToken.transfer(msg.sender, bounty));

		emit RevertedStake(
			message.sender,
			stakeData.amount,
			stakeData.beneficiary,
			message.gasPrice
		);
	}

	function confirmRevertRedemptionIntent(
		bytes32 _messageHash,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes
	)
	external
	returns (bool /*TBD*/)
	{
        uint256 initialGas = gasleft();
		//require(linked);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		MessageBus.Message storage message = unstakes[_messageHash].message;
		require(message.intentHash != bytes32(0));

		bytes32 storageRoot = storageRoots[_blockHeight];
		require(storageRoot != bytes32(0));

		require(MessageBus.confirmRevocation(
				messageBox,
				REDEEM_TYPEHASH,
				message,
				_rlpEncodedParentNodes,
				outboxOffset,
				storageRoot
			));

		emit RevertRedemptionIntentConfirmed(
			_messageHash,
			message.sender,
			message.nonce,
			_blockHeight
		);

        message.gasConsumed = gasleft().sub(initialGas);
		return true;
	}

	function confirmRedemptionIntent(
		address _redeemer,
		uint256 _redeemerNonce,
		address _beneficiary,
		uint256 _amount,
		uint256 _gasPrice,
		uint256 _blockHeight,
		bytes32 _hashLock,
		bytes memory _rlpParentNodes
	)
	public
	returns (bytes32 messageHash_)
	{
        uint256 initialGas = gasleft();
		require(_redeemer != address(0));
		require(_beneficiary != address(0));
		require(_amount != 0);
		require(_gasPrice != 0);
		require(_blockHeight != 0);
		require(_hashLock != bytes32(0));
		require(_rlpParentNodes.length != 0);

		//todo change to library call, stake too deep error
		bytes32 intentHash = keccak256(abi.encodePacked(_amount, _beneficiary, _redeemer, _gasPrice));
		messageHash_ = MessageBus.messageDigest(REDEEM_TYPEHASH, intentHash, _redeemerNonce, _gasPrice);

		bytes32 previousMessageHash = initiateNewOutboxProcess(_redeemer, _redeemerNonce, messageHash_);
		delete unstakes[previousMessageHash];

		unstakes[messageHash_] = getUnStake(
			_amount,
			_beneficiary,
			_redeemer,
			_redeemerNonce,
			_gasPrice,
			intentHash,
			_hashLock
		);

		executeConfirmRedemptionIntent(unstakes[messageHash_].message, _blockHeight, _rlpParentNodes);

		emit RedemptionIntentConfirmed(
			messageHash_,
			_redeemer,
			_redeemerNonce,
			_beneficiary,
			_amount,
			_blockHeight,
			_hashLock
		);

        unstakes[messageHash_].message.gasConsumed = gasleft().sub(initialGas);
	}

	function progressUnstake(
		bytes32 _messageHash,
		bytes32 _unlockSecret)
	external
	returns (
		uint256 unstakeTotalAmount_,
		uint256 unstakeAmount_,
		uint256 rewardAmount_
	)
	{
        uint256 initialGas = gasleft();
		//require(linked);
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		MessageBus.Message storage message = unstakes[_messageHash].message;

        Unstake storage unStake = unstakes[_messageHash];
        MessageBus.progressInbox(messageBox, REDEEM_TYPEHASH, unStake.message, _unlockSecret);

		unstakeTotalAmount_ = unStake.amount;
		//TODO: Remove the hardcoded 50000. Discuss and implement it properly
		rewardAmount_ = MessageBus.feeAmount(message, initialGas, 50000, GAS_LIMIT); //21000 * 2 for transactions + approx buffer
		unstakeAmount_ = unStake.amount.sub(rewardAmount_);

		require(stakeVault.releaseTo(unStake.beneficiary, unstakeAmount_));
		//reward beneficiary with the reward amount
		require(token.transfer(msg.sender, rewardAmount_));



		emit ProgressedUnstake(
			_messageHash,
			unstakeAmount_,
			unStake.beneficiary,
			rewardAmount_
		);
	}

	function progressUnstakeWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
	public
	returns (
		uint256 unstakeTotalAmount_,
		uint256 unstakeAmount_,
		uint256 rewardAmount_
	)
	{
        uint256 initialGas = gasleft();
		//require(linked);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		MessageBus.Message storage message = unstakes[_messageHash].message;

		bytes32 storageRoot = storageRoots[_blockHeight];
		require(storageRoot != bytes32(0));

		Unstake storage unStake = unstakes[_messageHash];

        MessageBus.progressInboxWithProof(
            messageBox,
			REDEEM_TYPEHASH,
            unStake.message,
            _rlpEncodedParentNodes,
            outboxOffset,
            storageRoot,
            MessageBus.MessageStatus(_messageStatus)
        );

		unstakeTotalAmount_ = unStake.amount;
		//TODO: Remove the hardcoded 50000. Discuss and implement it properly
		rewardAmount_ = MessageBus.feeAmount(message, initialGas, 50000, GAS_LIMIT); //21000 * 2 for transactions + approx buffer
		unstakeAmount_ = unStake.amount.sub(rewardAmount_);

		require(stakeVault.releaseTo(unStake.beneficiary, unstakeAmount_));
		//reward beneficiary with the fee
		require(token.transfer(msg.sender, rewardAmount_));

		emit ProgressedUnstake(
			_messageHash,
			unstakeAmount_,
			unStake.beneficiary,
			rewardAmount_
		);
	}


	/**
	 *  @notice External function prove gateway.
	 *
	 *  @dev proveGateway can be called by anyone to verify merkle proof of gateway contract address.
	 *		   Trust factor is brought by stateRoots mapping. stateRoot is committed in commitStateRoot function by mosaic process
	 *		   which is a trusted decentralized system running separately.
	 * 		   It's important to note that in replay calls of proveGateway bytes _rlpParentNodes variable is not validated. In this case
	 *		   input storage root derived from merkle proof account nodes is verified with stored storage root of given blockHeight.
	 *		   GatewayProven event has parameter wasAlreadyProved to differentiate between first call and replay calls.
	 *
	 *  @param _blockHeight Block height at which Gateway is to be proven.
	 *  @param _rlpEncodedAccount RLP encoded account node object.
	 *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
	 *
	 *  @return bool Status.
	 */
	function proveGateway(
		uint256 _blockHeight,
		bytes _rlpEncodedAccount,
		bytes _rlpParentNodes)
	external
	returns (bool /* success */)
	{
		// _rlpEncodedAccount should be valid
		require(_rlpEncodedAccount.length != 0, "Length of RLP encoded account is 0");
		// _rlpParentNodes should be valid
		require(_rlpParentNodes.length != 0, "Length of RLP parent nodes is 0");

		bytes32 stateRoot = core.getStateRoot(_blockHeight);
		// State root should be present for the block height
		require(stateRoot != bytes32(0), "State root is 0");

		// If account already proven for block height
		bytes32 provenStorageRoot = storageRoots[_blockHeight];

		if (provenStorageRoot != bytes32(0)) {
			// Check extracted storage root is matching with existing stored storage root
			require(provenStorageRoot == storageRoot, "Storage root mismatch when account is already proven");
			// wasAlreadyProved is true here since proveOpenST is replay call for same block height
			emit GatewayProven(_blockHeight, storageRoot, true);
			// return true
			return true;
		}

		bytes32 storageRoot = ProofLib.proveAccount(_rlpEncodedAccount, _rlpParentNodes, encodedCoGatewayPath, stateRoot);

		storageRoots[_blockHeight] = storageRoot;
		// wasAlreadyProved is false since proveOpenST is called for the first time for a block height
		emit GatewayProven(_blockHeight, storageRoot, false);

		return true;
	}

	/*private functions*/
	function executeConfirmRedemptionIntent(
		MessageBus.Message storage _message,
		uint256 _blockHeight,
		bytes _rlpParentNodes
	)
	private
	{
		bytes32 storageRoot = storageRoots[_blockHeight];
		require(storageRoot != bytes32(0));

		MessageBus.confirmMessage(
			messageBox,
			REDEEM_TYPEHASH,
			_message,
			_rlpParentNodes,
			outboxOffset,
			storageRoot);
	}

	function getUnStake(
		uint256 _amount,
		address _beneficiary,
		address _redeemer,
		uint256 _redeemerNonce,
		uint256 _gasPrice,
		bytes32 _intentHash,
		bytes32 _hashLock
	)
	private
	pure
	returns (Unstake)
	{
		return Unstake({
			amount : _amount,
			beneficiary : _beneficiary,
			message : getMessage(_redeemer, _redeemerNonce, _gasPrice, _intentHash, _hashLock)
			});
	}


	function getMessage(
		address _redeemer,
		uint256 _redeemerNonce,
		uint256 _gasPrice,
		bytes32 _intentHash,
		bytes32 _hashLock
	)
	private
	pure
	returns (MessageBus.Message)
	{
		return MessageBus.Message({
			intentHash : _intentHash,
			nonce : _redeemerNonce,
			gasPrice : _gasPrice,
			sender : _redeemer,
			hashLock : _hashLock,
            gasConsumed: 0
			});

	}

	function initiateNewOutboxProcess(
		address _account,
		uint256 _nonce,
		bytes32 _messageHash)
	private
	returns (bytes32 previousMessageHash_)
	{
		require(_nonce == _getNonce(_account));

		previousMessageHash_ = activeProcess[_account];

		if (previousMessageHash_ != bytes32(0)) {

			require(
				messageBox.outbox[previousMessageHash_] != MessageBus.MessageStatus.Progressed ||
				messageBox.outbox[previousMessageHash_] != MessageBus.MessageStatus.Revoked
			);
			//TODO: Commenting below line. Please check if deleting this will effect any process related to merkle proof in other chain.
			//delete messageBox.outbox[previousMessageHash_];
		}

		activeProcess[_account] = _messageHash;
	}

	function initiateNewInboxProcess(
		address _account,
		uint256 _nonce,
		bytes32 _messageHash)
	private
	returns (bytes32 previousMessageHash_)
	{
		require(_nonce == _getNonce(_account));

		previousMessageHash_ = activeProcess[_account];

		if (previousMessageHash_ != bytes32(0)) {

			require(
				messageBox.inbox[previousMessageHash_] != MessageBus.MessageStatus.Progressed ||
				messageBox.inbox[previousMessageHash_] != MessageBus.MessageStatus.Revoked
			);
			//TODO: Commenting below line. Please check if deleting this will effect any process related to merkle proof in other chain.
			//delete messageBox.inbox[previousMessageHash_];
		}

		activeProcess[_account] = _messageHash;
	}

	function _getNonce(address _account)
	private
	view
	returns (uint256 /* nonce */)
	{
		bytes32 messageHash = activeProcess[_account];
		if (messageHash == bytes32(0)) {
			return 0;
		}

		MessageBus.Message storage message = stakes[messageHash].message;
		return message.nonce.add(1);
	}

	function getNonce(address _account)
	external
	view
	returns (uint256 /* nonce */)
	{
		return _getNonce(_account);
	}

	function isLinked()
	external
	view
	returns (bool)
	{
		return linked;
	}

	function isDeactivated()
	external
	view
	returns (bool)
	{
		return deactivated;
	}

	function setGatewayActive(bool _active)
	external
	onlyOrganisation
	returns (bool)
	{
		deactivated = !_active;
	}
}




