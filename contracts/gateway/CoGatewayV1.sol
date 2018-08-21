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

	event RevertStakingIntentConfirmed(
		bytes32 messageHash,
		address staker,
		uint256 stakerNonce,
		uint256 blockHeight
	);

	struct Mint {
		uint256 amount;
		address beneficiary;
		uint256 fee;
	}

	bytes32 constant STAKE_REQUEST_TYPEHASH = keccak256(
		abi.encode(
			"StakeRequest(uint256 amount,address beneficiary,uint256 fee)"
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
	mapping(address /*address*/ => uint256) nonces;

	constructor(
		bytes32 _uuid,
		uint256 _bounty,
		WorkersInterface _workers,
		UtilityTokenAbstract _utilityToken,
		CoreInterface _core
	)
	public
	{
		require(_uuid != bytes32(0));
		require(_bounty != 0);
		require(_workers != address(0));
		require(_utilityToken != address(0));
		require(_core != address(0));

		//todo generate uuid from branded token
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
		uint256 _blockHeight,
		bytes32 _hashLock,
		bytes _rlpParentNodes,
		bytes _signature
	)
	external
	returns (bytes32 messageHash_)
	{

		require(_staker != address(0));
		require(_stakerNonce == nonces[_staker]);
		require(_beneficiary != address(0));
		require(_amount != 0);
		require(_fee != 0);
		require(_gasPrice != 0);
		require(_blockHeight != 0);
		require(_hashLock != bytes32(0));
		require(_rlpParentNodes.length != 0);
		require(_signature.length != 0);

		//todo change to library call, stake too deep error
		bytes32 intentHash = keccak256(abi.encodePacked(_amount, _beneficiary, _staker, _gasPrice, _fee));

		messageHash_ = MessageBus.messageDigest(STAKE_REQUEST_TYPEHASH, intentHash, _stakerNonce, _gasPrice);

		mints[messageHash_] = getMint(_amount, _beneficiary, _fee);

		messages[messageHash_] = getMessage(
			_staker,
			_stakerNonce,
			_gasPrice,
			intentHash,
			_hashLock,
			_signature
		);

		executeConfirmStakingIntent(messages[messageHash_], _blockHeight, _rlpParentNodes);

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
	returns (uint256 mintRequestedAmount_)
	{
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		MessageBus.Message storage message = messages[_messageHash];

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		Mint storage mint = mints[_messageHash];

		mintRequestedAmount_ = mint.amount;
		//Mint token after subtracting fee
		require(UtilityTokenInterface(utilityToken).mint(mint.beneficiary, mint.amount - mint.fee));
		//reward beneficiary with the fee
		require(UtilityTokenInterface(utilityToken).mint(msg.sender, mint.fee));

		MessageBus.progressInbox(messageBox, STAKE_REQUEST_TYPEHASH, messages[_messageHash], _unlockSecret);

		emit MintProcessed(
			_messageHash,
			mint.amount,
			mint.beneficiary,
			mint.fee
		);

		delete mints[_messageHash];
		delete messages[_messageHash];
		//todo don't delete, due to revocation message
		//delete messageBox.inbox[_messageHash];
	}

	function executeConfirmStakingIntent(
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
			STAKE_REQUEST_TYPEHASH,
			_message,
			_rlpParentNodes,
			outboxOffset,
			core.getStorageRoot(_blockHeight));

		nonces[_message.sender] = _message.nonce + 1;
	}

	function getMessage(
		address _staker,
		uint256 _stakerNonce,
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
			nonce : _stakerNonce,
			gasPrice : _gasPrice,
			signature : _signature,
			sender : _staker,
			hashLock : _hashLock
			});

	}

	function getMint(
		uint256 _amount,
		address _beneficiary,
		uint256 _fee
	)
	private
	pure
	returns (Mint)
	{
		return Mint({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee
			});
	}


	function confirmRevertStakingIntent(
		bytes32 _messageHash,
		bytes _signature,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes)
	external
	returns (bool /*TBD*/)
	{
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);
		require(_signature.length > 0);

		MessageBus.Message storage message = messages[_messageHash];
		require(message.intentHash !=  bytes32(0));

		require(nonces[message.sender] == message.nonce + 1);

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		require(MessageBus.confirmRevocation(
				messageBox,
				STAKE_REQUEST_TYPEHASH,
				message,
				_signature,
				_rlpEncodedParentNodes,
				outboxOffset,
				storageRoot
			));

		emit RevertStakingIntentConfirmed(
			_messageHash,
			message.sender,
			nonces[message.sender],
			_blockHeight
		);

		// TODO: deletion

		return true;
	}

}
