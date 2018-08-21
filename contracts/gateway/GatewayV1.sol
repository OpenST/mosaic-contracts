pragma solidity ^0.4.23;

import "./WorkersInterface.sol";
import "./EIP20Interface.sol";
import "./SimpleStake.sol";
import "./MessageBus.sol";
import "./CoreInterface.sol";
import "./HasherV1.sol";
import "./SimpleStake.sol";
import "./SafeMath.sol";

contract GatewayV1 {

	using SafeMath for uint256;

	event  StakeRequestedEvent(
		bytes32 messageHash,
		uint256 amount,
		uint256 fee,
		address beneficiary,
		address staker,
		bytes32 intentHash
	);

	event StakeProcessed(
		bytes32 messageHash,
		uint256 amount,
		address beneficiary,
		uint256 fee
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

	struct StakeRequest {
		uint256 amount;
		address beneficiary;
		uint256 fee;
	}

	struct UnStakes {
		uint256 amount;
		address beneficiary;
		uint256 fee;
	}

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

	//uuid of branded token
	bytes32 public uuid;
	//Escrow address to lock staked fund
	SimpleStake stakeVault;
	//amount in BT which is staked by facilitator
	uint256 public bounty;
	//white listed addresses which can act as facilitator
	WorkersInterface public workers;
	//address of branded token
	EIP20Interface public brandedToken;

	CoreInterface core;

	mapping(address/*staker*/ => uint256) nonces;

	mapping(bytes32 /*messageHash*/ => MessageBus.Message) messages;
	MessageBus.MessageBox messageBox;
	mapping(bytes32 => StakeRequest) stakeRequests;

	mapping(bytes32 /*messageHash*/ => UnStakes) unStakes;

	uint8 outboxOffset = 4;

	/**
         *  @notice Contract constructor.
         *
         *  @param  _uuid UUID of utility token.
         *  @param _bounty Bounty amount that worker address stakes while accepting stake request.
         *  @param _workers Workers contract address.
         *  @param _brandedToken Branded token contract address.
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
	public
	returns (bytes32 messageHash_)
	{
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_staker != address(0));
		require(_hashLock != bytes32(0));
		require(_signature.length != 0);
		require(nonces[msg.sender] == _nonce);

		nonces[msg.sender]++;

		bytes32 intentHash = HasherV1.intentHash(_amount, _beneficiary, _staker, _gasPrice, _fee);

		messageHash_ = MessageBus.messageDigest(STAKE_REQUEST_TYPEHASH, intentHash, _nonce, _gasPrice);

		messages[messageHash_] = MessageBus.Message({
			intentHash : intentHash,
			nonce : _nonce,
			gasPrice : _gasPrice,
			signature : _signature,
			sender : _staker,
			hashLock : _hashLock
			});

		stakeRequests[messageHash_] = StakeRequest({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee
			});

		MessageBus.declareMessage(messageBox, STAKE_REQUEST_TYPEHASH, messages[messageHash_]);
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
		MessageBus.Message storage message = messages[_messageHash];

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		stakeRequestAmount = stakeRequests[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, STAKE_REQUEST_TYPEHASH, messages[_messageHash], _unlockSecret);

		require(EIP20Interface(brandedToken).transfer(stakeVault, stakeRequestAmount));

		//return bounty
		require(EIP20Interface(brandedToken).transfer(msg.sender, bounty));

		emit StakeProcessed(
			_messageHash,
			stakeRequests[_messageHash].amount,
			stakeRequests[_messageHash].beneficiary,
			stakeRequests[_messageHash].fee
		);
		delete stakeRequests[_messageHash];
		delete messages[_messageHash];
		//todo discuss not delete due to revocation message
		//delete messageBox.outbox[_messageHash];

	}

	function revertStaking(
		bytes32 _messageHash,
		bytes _signature)
	external
	returns (address staker_, bytes32 intentHash_, uint256 nonce_, uint256 gasPrice_)
	{
		require(_messageHash != bytes32(0));
		MessageBus.Message storage message = messages[_messageHash];

		require(message.intentHash != bytes32(0));

		require(nonces[message.sender] == message.nonce+1);

		require(MessageBus.declareRevocationMessage (
			messageBox,
			STAKE_REQUEST_TYPEHASH,
			message,
			_signature));

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

		MessageBus.Message storage message = messages[_messageHash];
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

		// TODO: deletion
		emit StakeReverted(
			message.sender,
			stakeRequest.amount,
			stakeRequest.beneficiary,
			stakeRequest.fee,
			message.gasPrice);
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
		bytes _rlpParentNodes,
		bytes _signature
	)
	external
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

		//todo change to library call, stake too deep error
		bytes32 intentHash = keccak256(abi.encodePacked(_amount, _beneficiary, _redeemer, _gasPrice, _fee));

		messageHash_ = MessageBus.messageDigest(REDEEM_REQUEST_TYPEHASH, intentHash, _redeemerNonce, _gasPrice);

		unStakes[messageHash_] = getUnStake(_amount, _beneficiary, _fee);

		messages[messageHash_] = getMessage(
			_redeemer,
			_redeemerNonce,
			_gasPrice,
			intentHash,
			_hashLock,
			_signature
		);

		executeConfirmRedemptionIntent(messages[messageHash_], _blockHeight, _rlpParentNodes);

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
		uint256 _fee
	)
	private
	pure
	returns (UnStakes)
	{
		return UnStakes({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee
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

	function processUnstake(
		bytes32 _messageHash,
		bytes32 _unlockSecret)
	external
	returns (uint256 unstakeAmount_)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		MessageBus.Message storage message = messages[_messageHash];

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		UnStakes storage unStake = unStakes[_messageHash];

		unstakeAmount_ = unStake.amount.sub(unStake.fee);

		require(stakeVault.releaseTo(unStake.beneficiary, unstakeAmount_));
		//reward beneficiary with the fee
		require(brandedToken.transfer(msg.sender, unStake.fee));

		MessageBus.progressInbox(messageBox, REDEEM_REQUEST_TYPEHASH, messages[_messageHash], _unlockSecret);

		emit UnStakeProcessed(
			_messageHash,
			unStake.amount,
			unStake.beneficiary,
			unStake.fee
		);

		delete unStakes[_messageHash];
		delete messages[_messageHash];
		//todo don't delete, due to revocation message
		//delete messageBox.inbox[_messageHash];
	}
}




