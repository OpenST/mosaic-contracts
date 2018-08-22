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


import "./WorkersInterface.sol";
import "./EIP20Interface.sol";
import "./SimpleStake.sol";
import "./MessageBus.sol";
import "./CoreInterface.sol";
import "./HasherV1.sol";
import "./SimpleStake.sol";
import "./SafeMath.sol";

/**
 * @title Gateway Contract
 *
 *  @notice Gateway contract is staking Gateway that separates the concerns of staker and staking processor.
 *          Stake process is executed through Gateway contract rather than directly with the protocol contract.
 *          The Gateway contract will serve the role of staking account rather than an external account.
 *
 */
contract GatewayV1 {

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
		uint256 fee
	);

	event RevertRedemptionIntentConfirmed(
		bytes32 messageHash,
		address redeemer,
		uint256 redeemerNonce,
		uint256 blockHeight
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
	}

	struct UnStakes {
		uint256 amount;
		address beneficiary;
		uint256 fee;
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

	//uuid of branded token.
	bytes32 public uuid;
	//Escrow address to lock staked fund
	SimpleStake stakeVault;
	//amount in BT which is staked by facilitator
	uint256 public bounty;
	//White listed addresses which can act as facilitator.
	WorkersInterface public workers;
	//address of branded token.
	EIP20Interface public brandedToken;
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
	 *  @param  _uuid UUID of utility token.
	 *  @param _bounty Bounty amount that worker address stakes while accepting stake request.
	 *  @param _workers Workers contract address.
	 *  @param _brandedToken Branded token contract address.
	 *  @param _core Core contract address.
	 */
	constructor(
		bytes32 _uuid,
		uint256 _bounty,
		WorkersInterface _workers,
		EIP20Interface _brandedToken,
		CoreInterface _core
	)
	public
	{
		//todo generate uuid from branded Token ?
		require(_uuid != bytes32(0));
		require(_workers != address(0));
		require(_brandedToken != address(0));
		require(_core != address(0));

		uuid = _uuid;
		bounty = _bounty;
		workers = _workers;
		brandedToken = _brandedToken;
		core = _core;
		stakeVault = new SimpleStake(brandedToken, address(this), uuid);
	}
	/* Public functions */

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
			message : getMessage(_staker, _nonce, _gasPrice, intentHash, _hashLock, _signature)
			});

		MessageBus.declareMessage(messageBox, STAKE_REQUEST_TYPEHASH, stakeRequests[messageHash_].message);
		//transfer staker amount to gateway
		require(brandedToken.transferFrom(_staker, this, _amount));
		//transfer bounty to gateway
		require(brandedToken.transferFrom(msg.sender, this, bounty));

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
	returns (uint256 stakeRequestAmount)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));
		MessageBus.Message storage message = stakeRequests[_messageHash].message;

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		stakeRequestAmount = stakeRequests[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, STAKE_REQUEST_TYPEHASH, stakeRequests[_messageHash].message, _unlockSecret);

		require(EIP20Interface(brandedToken).transfer(stakeVault, stakeRequestAmount));

		//return bounty
		require(EIP20Interface(brandedToken).transfer(msg.sender, bounty));

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
		bytes _rlpEncodedParentNodes)
	external
	returns (bool /*TBD*/)
	{
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

		require(brandedToken.transfer(message.sender, stakeRequest.amount));

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
		bytes _signature,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes
	)
	external
	returns (bool /*TBD*/)
	{
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);
		require(_signature.length > 0);

		MessageBus.Message storage message = unStakes[_messageHash].message;
		require(message.intentHash != bytes32(0));

		require(nonces[message.sender] == message.nonce + 1);

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		require(MessageBus.confirmRevocation(
				messageBox,
				REDEEM_REQUEST_TYPEHASH,
				message,
				_signature,
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
			_hashLock,
			_signature
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
		uint256 unstakeAmount_
	)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		MessageBus.Message storage message = unStakes[_messageHash].message;

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		UnStakes storage unStake = unStakes[_messageHash];

		unstakeRequestedAmount_ = unStake.amount;
		unstakeAmount_ = unStake.amount.sub(unStake.fee);

		require(stakeVault.releaseTo(unStake.beneficiary, unstakeAmount_));
		//reward beneficiary with the fee
		require(brandedToken.transfer(msg.sender, unStake.fee));

		MessageBus.progressInbox(messageBox, REDEEM_REQUEST_TYPEHASH, unStake.message, _unlockSecret);

		emit UnStakeProcessed(
			_messageHash,
			unStake.amount,
			unStake.beneficiary,
			unStake.fee
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
		bytes32 _hashLock,
		bytes _signature
	)
	private
	pure
	returns (UnStakes)
	{
		return UnStakes({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee,
			message : getMessage(_redeemer, _redeemerNonce, _gasPrice, _intentHash, _hashLock, _signature)//message// MessageBus.Message()//getMessage(_redeemer, _redeemerNonce, _gasPrice, _intentHash, _hashLock, _signature)
			});
	}


	function getMessage(
		address _redeemer,
		uint256 _redeemerNonce,
		uint256 _gasPrice,
		bytes32 _intentHash,
		bytes32 _hashLock,
		bytes _signature
	)
	private
	pure
	returns (MessageBus.Message)
	{
		return MessageBus.Message({
			intentHash : _intentHash,
			nonce : _redeemerNonce,
			gasPrice : _gasPrice,
			signature : _signature,
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




