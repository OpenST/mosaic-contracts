pragma solidity ^0.4.23;

import "./MessageBus.sol";
import "./WorkersInterface.sol";
import "./CoreInterface.sol";
import "./EIP20Interface.sol";
import "./UtilityTokenAbstract.sol";

contract CoGatewayV1 {

	event  StakingIntentConfirmed(
		bytes32 messageHash,
		address staker,
		uint256 stakerNonce,
		address beneficiary,
		uint256 amount,
		uint256 fee,
		uint256 blockHeight,
		bytes32 hashLock
	);

	event MintProcessed(
		bytes32 messageHash,
		uint256 amount,
		address beneficiary,
		uint256 fee
	);
	struct Mint {
		uint256 amount;
		address beneficiary;
		uint256 fee;
	}

	bytes32 constant STAKEREQUEST_TYPEHASH = keccak256
	(
		abi.encode(
			"StakeRequest(uint256 amount,address beneficiary,address staker,uint256 fee,uint256 nonce,uint8 v,bytes32 r,bytes32 s)"
		)
	);
	bytes32 constant MINTREQUEST_TYPEHASH = keccak256
	(
		abi.encode(
			"Mint(uint256 amount,address beneficiary,uint256 fee)"
		)
	);
	bytes32 constant PROCESSMINT_TYPEHASH = keccak256
	(
		abi.encode(
			"function processMinting(bytes32 _messageHash,bytes32 _unlockSecret)"
		)
	);
	
	bytes32 uuid;
	uint256 bounty;
	WorkersInterface public workers;
	MessageBus.MessageBox messageBox;
	mapping(bytes32 /*intentHash*/ => MessageBus.Message) messages;
	uint8 outboxOffset = 4;
	CoreInterface core;
	UtilityTokenAbstract utilityToken;

	mapping(bytes32 /*requestHash*/ => Mint) mints;

	constructor(
		bytes32 _uuid,
		uint256 _bounty,
		WorkersInterface _workers,
		UtilityTokenAbstract _utilityToken,
		CoreInterface _core
	){

		uuid = _uuid;
		bounty = _bounty;
		workers = _workers;
		utilityToken = _utilityToken;
		core = _core;

	}

	function confirmStakingIntent(
		address _staker,
		uint256 _stakerNonce,
		address _beneficiary,
		uint256 _amount,
		uint256 _fee,
		uint256 _gasPrice,
		bytes32 _intentHash,
		uint256 _blockHeight,
		bytes32 _hashLock,
		bytes _rlpParentNodes,
		bytes _signature
	)
	external
	returns (bytes32 messageHash_)
	{

		require(_staker != address(0));
		require(_stakerNonce != 0);
		require(_beneficiary != address(0));
		require(_amount != 0);
		require(_fee != 0);
		require(_gasPrice != 0);
		require(_intentHash != bytes32(0));
		require(_blockHeight != 0);
		require(_hashLock != bytes32(0));
		require(_rlpParentNodes.length != 0);
		require(_signature.length != 0);

		messageHash_ = MessageBus.messageDigest(STAKEREQUEST_TYPEHASH, _intentHash, _stakerNonce, _gasPrice);

		mints[messageHash_] = getMint(_amount, _beneficiary, _fee);

		messages[messageHash_] = getMessage(
			_staker,
			_stakerNonce,
			_gasPrice,
			_intentHash,
			_hashLock,
			_signature
		);

		executeConfirmStakingIntent(messageHash_, messages[messageHash_], _blockHeight, _rlpParentNodes);

		emit StakingIntentConfirmed(
			messageHash_,
			_staker,
			_stakerNonce,
			_beneficiary,
			_amount,
			_fee,
			_blockHeight,
			_hashLock
		);
	}

	function processMinting(
		bytes32 _messageHash,
		bytes32 _unlockSecret)
	external
	returns (uint256 amount)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		MessageBus.Message message = messages[_messageHash];


		Mint storage mint = mints[_messageHash];

		amount = mint.amount;

		require(UtilityTokenInterface(utilityToken).mint(mint.beneficiary, mint.amount));

		MessageBus.progressInbox(messageBox, PROCESSMINT_TYPEHASH, messages[_messageHash], _unlockSecret);

		emit MintProcessed(
			_messageHash,
			mint.amount,
			mint.beneficiary,
			mint.fee
		);

		delete mints[_messageHash];
		delete messages[_messageHash];
		delete messageBox.inbox[_messageHash];
	}

	function executeConfirmStakingIntent(
		bytes32 _messageHash,
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
			MINTREQUEST_TYPEHASH,
			_message,
			_rlpParentNodes,
			outboxOffset,
			core.getStorageRoot(_blockHeight));
	}

	function getMessage(
		address _staker,
		uint256 _stakerNonce,
		uint256 _gasPrice,
		bytes32 _intentHash,
		bytes32 _hashLock,
		bytes _signature)
	private
	returns (MessageBus.Message)
	{
		MessageBus.Message memory message = MessageBus.Message({
			intentHash : _intentHash,
			nonce : _stakerNonce,
			gasPrice : _gasPrice,
			signature : _signature,
			sender : _staker,
			hashLock : _hashLock
			});
		return message;
	}

	function getMint(
		uint256 _amount,
		address _beneficiary,
		uint256 _fee)
	private
	returns (Mint)
	{
		Mint memory mint = Mint({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee
			});
		return mint;

	}

}
