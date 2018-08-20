pragma solidity ^0.4.23;

import "./WorkersInterface.sol";
import "./EIP20Interface.sol";
import "./SimpleStake.sol";
import "./MessageBus.sol";
import "./CoreInterface.sol";
import "./HasherV1.sol";

contract GatewayV1 {

	event  StakeRequestedEvent(
		bytes32 messageHash,
		uint256 amount,
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

	struct StakeRequest {
		uint256 amount;
		address beneficiary;
		uint256 fee;
	}

	bytes32 constant STAKE_REQUEST_TYPEHASH = keccak256(
		abi.encode(
			"StakeRequest(uint256 amount,address beneficiary,address staker,uint256 fee,uint256 nonce,uint8 v,bytes32 r,bytes32 s)"
		)
	);

	bytes32 constant PROCESS_STAKING_TYPEHASH = keccak256(
		abi.encode(
			"function processStaking(bytes32 _messageHash,bytes32 _unlockSecret)"
		)
	);
	//uuid of branded token
	bytes32 public uuid;
	//Escrow address to lock staked fund
	address stakeVault;
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
	{
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
		bytes32 _intentHash,
		bytes _signature
	)
	returns (bytes32 messageHash_)
	{
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_staker != address(0));
		require(_hashLock != bytes32(0));
		require(_signature.length != 0);
		require(nonces[msg.sender] == _nonce);

		nonces[msg.sender] = _nonce ++;

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
		require(EIP20Interface(brandedToken).transferFrom(_staker, this, _amount));
		//transfer bounty to gateway
		require(EIP20Interface(brandedToken).transferFrom(msg.sender, this, bounty));

		emit StakeRequestedEvent(
			messageHash_,
			_amount,
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

		nonces[message.sender] = nonces[message.sender] + 1;

		stakeRequestAmount = stakeRequests[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, PROCESS_STAKING_TYPEHASH, messages[_messageHash], _unlockSecret);

		require(EIP20Interface(brandedToken).transfer(stakeVault, stakeRequestAmount));

		emit StakeProcessed(
			_messageHash,
			stakeRequests[_messageHash].amount,
			stakeRequests[_messageHash].beneficiary,
			stakeRequests[_messageHash].fee
		);
		delete stakeRequests[_messageHash];
		delete messages[_messageHash];
		delete messageBox.outbox[_messageHash];

	}

}
