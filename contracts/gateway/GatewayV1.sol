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
import "./SimpleStake.sol";
import "./MessageBus.sol";
import "./CoreInterface.sol";
import "./HasherV1.sol";
import "./SimpleStakeV1.sol";
import "./SafeMath.sol";
import "./Owned.sol";

/**
 * @title Gateway Contract
 *
 *  @notice Gateway contract is staking Gateway that separates the concerns of staker and staking processor.
 *          Stake process is executed through Gateway contract rather than directly with the protocol contract.
 *          The Gateway contract will serve the role of staking account rather than an external account.
 *
 */
contract GatewayV1 is Owned{

	using SafeMath for uint256;

	/* Events */

	event  StakeRequestedEvent(
		bytes32 _messageHash,
		uint256 _amount,
		uint256 _fee,
		address _beneficiary,
		address _staker,
		bytes32 _intentHash
	);

	event StakeProcessed(
		bytes32 _messageHash,
		uint256 _amount,
		address _beneficiary,
		uint256 _fee
	);

	event RevertStakeRequested(
		bytes32 messageHash,
		address staker,
		bytes32 intentHash,
		uint256 nonce,
		uint256 gasPrice
	);

	event StakeReverted(
		address staker,
		uint256 amount,
		address beneficiary,
		uint256 fee,
		uint256 gasPrice
	);

	event RedemptionIntentConfirmed(
		bytes32 messageHash,
		address redeemer,
		uint256 redeemerNonce,
		address beneficiary,
		uint256 amount,
		uint256 fee,
		uint256 blockHeight,
		bytes32 hashLock
	);

	event UnStakeProcessed(
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

	/* Struct */
	/**
	 *  It denotes the stake request.
	 *  Status values could be :-
	 *  0 :- amount used for staking
	 *  1 :- beneficiary is the address in the target chain where token will be minted.
	 *  2 :- fee is the amount rewarded to facilitator after successful stake and mint.
	 */
	struct StakeRequest {
		uint256 amount;
		address beneficiary;
		uint256 fee;
		MessageBus.Message message;
		address facilitator;
	}

	struct UnStakes {
		uint256 amount;
		address beneficiary;
		uint256 fee;
		MessageBus.Message message;
	}

	struct GatewayLink {
		bytes32 messageHash;
		MessageBus.Message message;
	}

	/* Storage */

	// It is a hash used to represent operation type.
	bytes32 constant STAKE_REQUEST_TYPEHASH = keccak256(
		abi.encode(
			"StakeRequest(uint256 amount,address beneficiary,uint256 fee)"
		)
	);

	bytes32 constant REDEEM_REQUEST_TYPEHASH = keccak256(
		abi.encode(
			"RedeemRequest(uint256 amount,address beneficiary,uint256 fee)"
		)
	);

	bytes32 constant GATEWAY_LINK_TYPEHASH =  keccak256(
		abi.encode(
			"GatewayLink(bytes32 messageHash,MessageBus.Message message)"
		)
	);


	address coGateway;
	bytes32 codeHashUT;
	bytes32 codeHashVT;
	bool isActivated;
	GatewayLink gatewayLink;

	//Escrow address to lock staked fund
	SimpleStakeV1 stakeVault;

	//amount in BT which is staked by facilitator
	uint256 public bounty;

	//address of branded token.
	EIP20Interface public token;
	//address of core contract.
	CoreInterface core;
	//It stores the nonces for each staker.
	mapping(address/*staker*/ => uint256) nonces;

	MessageBus.MessageBox messageBox;
	mapping(bytes32 /*messageHash*/ => StakeRequest) stakeRequests;
	mapping(address /*staker*/ => bytes32 /*messageHash*/) activeRequests;

	mapping(bytes32 /*messageHash*/ => UnStakes) unStakes;

	uint8 outboxOffset = 4;

	/**
	 *  @notice Contract constructor.
	 *
	 *  @param _token Branded token contract address.
	 *  @param _coGateway CoGateway contract address.
	 *  @param _core Core contract address.
	 *  @param _bounty Bounty amount that worker address stakes while accepting stake request.
	 *  @param _codeHashUT code hash of utility token contract.
	 */
	constructor(
		EIP20Interface _token,
		address _coGateway,
		CoreInterface _core,
		uint256 _bounty,
		bytes32 _codeHashUT,
		bytes32 _codeHashVT
	)
	Owned()
	public
	{
		require(_token != address(0));
		require(_coGateway != address(0));
		require(_core != address(0));
		require(_codeHashUT != bytes32(0));
		require(_codeHashVT != bytes32(0));

		isActivated = false;
		token = _token;
		coGateway = _coGateway;
		core = _core;
		bounty = _bounty;
		codeHashUT = _codeHashUT;
		codeHashVT = _codeHashVT;

		stakeVault = new SimpleStakeV1(token, address(this));
	}

	/* Public functions */

	function initiateGatewayLink(
		bytes32 _intentHash,
		uint256 _gasPrice,
		uint256 _fee,
		uint256 _nonce,
		address _sender,
		bytes32 _hashLock,
		bytes _signature)
	external
	returns (bytes32 messageHash_)
	{
		require(_sender == owner);
		require(gatewayLink.messageHash == bytes32(0));
		require(nonces[_sender] == _nonce);
		bytes32 intentHash = keccak256(
			abi.encodePacked(address(this),
				coGateway,
				bounty,
				codeHashUT,
				codeHashVT,
			    MessageBus.getCodeHash(),
				_gasPrice,
				_fee,
				_nonce
			)
		);
		require(intentHash == _intentHash);

		// check nonces
		messageHash_ = MessageBus.messageDigest(GATEWAY_LINK_TYPEHASH, intentHash, _nonce, _gasPrice);

		gatewayLink = GatewayLink ({
		 	messageHash: messageHash_,
			message: MessageBus.Message({
				intentHash : intentHash,
				nonce : _nonce,
				gasPrice : _gasPrice,
				sender : _sender,
				hashLock : _hashLock
				})
		});

		MessageBus.declareMessage(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _signature);

		nonces[_sender]++;

		emit GatewayLinkInitiated(
			messageHash_,
			address(this),
			coGateway,
			token
		);

	}

	function processGatewayLink(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (bool /*TBD*/)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		require(gatewayLink.messageHash == _messageHash);

		require(nonces[gatewayLink.message.sender] == gatewayLink.message.nonce + 1);
		nonces[gatewayLink.message.sender]++;

		MessageBus.progressOutbox(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _unlockSecret);

		isActivated = true;

		//return bounty
		require(token.transfer(msg.sender, bounty));

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
	 * @param _fee Fee for facilitation of stake process.
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
		uint256 _fee,
		uint256 _nonce,
		bytes32 _hashLock,
		bytes _signature
	)
	external
	returns (bytes32 messageHash_)
	{
		require(isActivated);
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_staker != address(0));
		require(_hashLock != bytes32(0));
		require(_signature.length != 0);
		require(nonces[msg.sender] == _nonce);

		require(cleanProcessedStakeRequest(_staker));

		nonces[msg.sender]++;

		bytes32 intentHash = HasherV1.intentHash(_amount, _beneficiary, _staker, _gasPrice, _fee);

		messageHash_ = MessageBus.messageDigest(STAKE_REQUEST_TYPEHASH, intentHash, _nonce, _gasPrice);

		activeRequests[_staker] = messageHash_;

		stakeRequests[messageHash_] = StakeRequest({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee,
			message : getMessage(_staker, _nonce, _gasPrice, intentHash, _hashLock),
			facilitator : msg.sender
			});

		MessageBus.declareMessage(messageBox, STAKE_REQUEST_TYPEHASH, stakeRequests[messageHash_].message, _signature);
		//transfer staker amount to gateway
		require(token.transferFrom(_staker, this, _amount));
		//transfer bounty to gateway
		require(token.transferFrom(msg.sender, this, bounty));

		emit StakeRequestedEvent(
			messageHash_,
			_amount,
			_fee,
			_beneficiary,
			_staker,
			intentHash
		);
	}

	function processStaking(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (uint256 stakeRequestAmount_)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));
		MessageBus.Message storage message = stakeRequests[_messageHash].message;

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		stakeRequestAmount_ = stakeRequests[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, STAKE_REQUEST_TYPEHASH, stakeRequests[_messageHash].message, _unlockSecret);

		require(token.transfer(stakeVault, stakeRequestAmount_));

		//return bounty
		require(token.transfer(msg.sender, bounty));

		emit StakeProcessed(
			_messageHash,
			stakeRequests[_messageHash].amount,
			stakeRequests[_messageHash].beneficiary,
			stakeRequests[_messageHash].fee
		);
	}

	function processStakingWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
	external
	returns (uint256 stakeRequestAmount_)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		MessageBus.Message storage message = stakeRequests[_messageHash].message;

		stakeRequestAmount_ = stakeRequests[_messageHash].amount;

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		//staker has started the revocation and facilitator has processed on utility chain
		//staker has to process with proof
		MessageBus.progressOutboxWithProof(
			messageBox,
			STAKE_REQUEST_TYPEHASH,
			stakeRequests[_messageHash].message,
			_rlpEncodedParentNodes,
			outboxOffset,
			storageRoot,
			MessageBus.MessageStatus(_messageStatus)
		);

		require(token.transfer(stakeVault, stakeRequestAmount_));

		//todo discuss return bounty
		require(token.transfer(stakeRequests[_messageHash].facilitator, bounty));

		emit StakeProcessed(
			_messageHash,
			stakeRequests[_messageHash].amount,
			stakeRequests[_messageHash].beneficiary,
			stakeRequests[_messageHash].fee
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
		require(isActivated);
		require(_messageHash != bytes32(0));
		MessageBus.Message storage message = stakeRequests[_messageHash].message;

		require(message.intentHash != bytes32(0));

		require(nonces[message.sender] == message.nonce+1);

		require(
			MessageBus.declareRevocationMessage(
			messageBox,
			STAKE_REQUEST_TYPEHASH,
			message,
				_signature
			)
		);

		staker_ = message.sender;
		intentHash_ = message.intentHash;
		nonce_ = nonces[message.sender];
		gasPrice_ = message.gasPrice;

		emit RevertStakeRequested(_messageHash, staker_, intentHash_, nonces[message.sender], gasPrice_);
	}

	function processRevertStaking(
		bytes32 _messageHash,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes
	)
	external
	returns (bool /*TBD*/)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		MessageBus.Message storage message = stakeRequests[_messageHash].message;
		require(message.intentHash != bytes32(0));

		require(nonces[message.sender] == message.nonce + 1);

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		require(MessageBus.progressRevocationMessage (
			messageBox,
			message,
			STAKE_REQUEST_TYPEHASH,
			outboxOffset,
			_rlpEncodedParentNodes,
			storageRoot));

		nonces[message.sender]++;

		StakeRequest storage stakeRequest = stakeRequests[_messageHash];

		require(token.transfer(message.sender, stakeRequest.amount));

		require(token.transfer(stakeRequests[_messageHash].facilitator, bounty));
		// TODO: think about bounty.
		emit StakeReverted(
			message.sender,
			stakeRequest.amount,
			stakeRequest.beneficiary,
			stakeRequest.fee,
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
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		MessageBus.Message storage message = unStakes[_messageHash].message;
		require(message.intentHash != bytes32(0));

		require(nonces[message.sender] == message.nonce + 1);

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		require(MessageBus.confirmRevocation(
				messageBox,
				REDEEM_REQUEST_TYPEHASH,
				message,
				_rlpEncodedParentNodes,
				outboxOffset,
				storageRoot
			));

		emit RevertRedemptionIntentConfirmed(
			_messageHash,
			message.sender,
			nonces[message.sender],
			_blockHeight
		);

		return true;
	}

	function confirmRedemptionIntent(
		address _redeemer,
		uint256 _redeemerNonce,
		address _beneficiary,
		uint256 _amount,
		uint256 _fee,
		uint256 _gasPrice,
		uint256 _blockHeight,
		bytes32 _hashLock,
		bytes memory _rlpParentNodes,
		bytes memory _signature
	)
	public
	returns (bytes32 messageHash_)
	{
		require(isActivated);
		require(_redeemer != address(0));
		require(_redeemerNonce == nonces[_redeemer]);
		require(_beneficiary != address(0));
		require(_amount != 0);
		require(_fee != 0);
		require(_gasPrice != 0);
		require(_blockHeight != 0);
		require(_hashLock != bytes32(0));
		require(_rlpParentNodes.length != 0);
		require(_signature.length != 0);

		require(cleanProcessedRedeemRequest(_redeemer));

		//todo change to library call, stake too deep error
		bytes32 intentHash = keccak256(abi.encodePacked(_amount, _beneficiary, _redeemer, _gasPrice, _fee));

		messageHash_ = MessageBus.messageDigest(REDEEM_REQUEST_TYPEHASH, intentHash, _redeemerNonce, _gasPrice);

		activeRequests[_redeemer] = messageHash_;

		unStakes[messageHash_] = getUnStake(
			_amount,
			_beneficiary,
			_fee,
			_redeemer,
			_redeemerNonce,
			_gasPrice,
			intentHash,
			_hashLock
		);

		executeConfirmRedemptionIntent(unStakes[messageHash_].message, _blockHeight, _rlpParentNodes);

		emit RedemptionIntentConfirmed(
			messageHash_,
			_redeemer,
			_redeemerNonce,
			_beneficiary,
			_amount,
			_fee,
			_blockHeight,
			_hashLock
		);
	}

	function processUnstake(
		bytes32 _messageHash,
		bytes32 _unlockSecret)
	external
	returns (
		uint256 unstakeRequestedAmount_,
		uint256 unstakeAmount_,
		uint256 rewardAmount_
	)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		MessageBus.Message storage message = unStakes[_messageHash].message;

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		UnStakes storage unStake = unStakes[_messageHash];

		unstakeRequestedAmount_ = unStake.amount;
		rewardAmount_ = unStake.fee.mul(message.gasPrice);
		unstakeAmount_ = unStake.amount.sub(rewardAmount_);

		require(stakeVault.releaseTo(unStake.beneficiary, unstakeAmount_));
		//reward beneficiary with the fee
		require(token.transfer(msg.sender, rewardAmount_));

		MessageBus.progressInbox(messageBox, REDEEM_REQUEST_TYPEHASH, unStake.message, _unlockSecret);

		emit UnStakeProcessed(
			_messageHash,
			unstakeAmount_,
			unStake.beneficiary,
			rewardAmount_
		);
	}

	function processUnstakeWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
	external
	returns (
		uint256 unstakeRequestedAmount_,
		uint256 unstakeAmount_,
		uint256 rewardAmount_
	)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		MessageBus.Message storage message = unStakes[_messageHash].message;

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		UnStakes storage unStake = unStakes[_messageHash];

		unstakeRequestedAmount_ = unStake.amount;
		rewardAmount_ = unStake.fee.mul(message.gasPrice);
		unstakeAmount_ = unStake.amount.sub(rewardAmount_);

		require(stakeVault.releaseTo(unStake.beneficiary, unstakeAmount_));
		//reward beneficiary with the fee
		require(token.transfer(msg.sender, rewardAmount_));

		MessageBus.progressInboxWithProof(
			messageBox,
			REDEEM_REQUEST_TYPEHASH,
			unStake.message,
			_rlpEncodedParentNodes,
			outboxOffset,
			storageRoot,
			MessageBus.MessageStatus(_messageStatus)
		);

		emit UnStakeProcessed(
			_messageHash,
			unstakeAmount_,
			unStake.beneficiary,
			rewardAmount_
		);
	}

	function executeConfirmRedemptionIntent(
		MessageBus.Message storage _message,
		uint256 _blockHeight,
		bytes _rlpParentNodes
	)
	private
	{
		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		MessageBus.confirmMessage(
			messageBox,
			REDEEM_REQUEST_TYPEHASH,
			_message,
			_rlpParentNodes,
			outboxOffset,
			core.getStorageRoot(_blockHeight));

		nonces[_message.sender] = _message.nonce + 1;
	}

	function getUnStake(
		uint256 _amount,
		address _beneficiary,
		uint256 _fee,
		address _redeemer,
		uint256 _redeemerNonce,
		uint256 _gasPrice,
		bytes32 _intentHash,
		bytes32 _hashLock
	)
	private
	pure
	returns (UnStakes)
	{
		return UnStakes({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee,
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
			hashLock : _hashLock
			});

	}

	function cleanProcessedStakeRequest(address staker)
	private
	returns (bool /*success*/)
	{
		bytes32 previousRequest = activeRequests[staker];

		if (previousRequest != bytes32(0)) {

			require(
				messageBox.outbox[previousRequest] != MessageBus.MessageStatus.Progressed ||
				messageBox.outbox[previousRequest] != MessageBus.MessageStatus.Revoked
			);
			delete stakeRequests[previousRequest];
			delete messageBox.inbox[previousRequest];
		}
	}

	function cleanProcessedRedeemRequest(address redeemer)
	private
	returns (bool /*success*/)
	{
		bytes32 previousRequest = activeRequests[redeemer];

		if (previousRequest != bytes32(0)) {

			require(
				messageBox.inbox[previousRequest] != MessageBus.MessageStatus.Progressed ||
				messageBox.inbox[previousRequest] != MessageBus.MessageStatus.Revoked
			);
			delete unStakes[previousRequest];
			delete messageBox.inbox[previousRequest];
		}
	}
}




