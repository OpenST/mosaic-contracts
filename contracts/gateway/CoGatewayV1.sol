pragma solidity ^0.4.23;

import "./MessageBus.sol";
import "./WorkersInterface.sol";
import "./CoreInterface.sol";
import "./EIP20Interface.sol";
import "./UtilityTokenAbstract.sol";
import "./EIP20Interface.sol";
import "./HasherV1.sol";
import "./Owned.sol";

contract CoGatewayV1 is Owned {

	using SafeMath for uint256;

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
		uint256 reward
	);

	event RevertStakingIntentConfirmed(
		bytes32 messageHash,
		address staker,
		uint256 stakerNonce,
		uint256 blockHeight
	);

	event RedeemRequested(
		bytes32 messageHash,
		uint256 amount,
		uint256 fee,
		address beneficiary,
		address redeemer,
		bytes32 intentHash
	);

	event RedeemProcessed(
		bytes32 messageHash,
		uint256 amount,
		address beneficiary,
		uint256 fee
	);

	event RevertRedeemRequested(
		bytes32 messageHash,
		address redeemer,
		bytes32 intentHash,
		uint256 nonce,
		uint256 gasPrice
	);

	event RedeemReverted(
		address redeemer,
		uint256 amount,
		address beneficiary,
		uint256 fee,
		uint256 gasPrice
	);

	struct Mint {
		uint256 amount;
		address beneficiary;
		uint256 fee;
		MessageBus.Message message;
	}

	event GatewayLinkConfirmed(
		bytes32 messageHash,
		address gateway,
		address cogateway,
		address token
	);

	/* Struct */
	/**
	 *  It denotes the redeem request.
	 *  Status values could be :-
	 *  0 :- amount used for redemption
	 *  1 :- beneficiary is the address in the target chain where token will be minted.
	 *  2 :- fee is the amount rewarded to facilitator after successful stake and mint.
	 */
	struct RedeemRequest {
		uint256 amount;
		address beneficiary;
		uint256 fee;
		MessageBus.Message message;
		address facilitator;
	}

	struct GatewayLink {
		bytes32 messageHash;
		MessageBus.Message message;
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
	bytes32 constant GATEWAY_LINK_TYPEHASH =  keccak256(
		abi.encode(
			"GatewayLink(bytes32 messageHash,MessageBus.Message message)"
		)
	);

	address token;
	address gateway;
	bytes32 codeHashUT;
	bytes32 codeHashVT;
	bool isActivated;
	GatewayLink gatewayLink;
	uint256 bounty;
	WorkersInterface public workers;
	MessageBus.MessageBox messageBox;
	uint8 outboxOffset = 4;
	CoreInterface core;
	UtilityTokenInterface utilityToken;

	mapping(bytes32 /*requestHash*/ => Mint) mints;
	mapping(address /*address*/ => uint256) nonces;
	mapping(bytes32/*messageHash*/ => RedeemRequest) redeemRequests;
	mapping(address /*redeemer*/ => bytes32 /*messageHash*/) activeRequests;

	constructor(
		EIP20Interface _token,
		//address _gateway,
		CoreInterface _core,
		uint256 _bounty,
		bytes32 _codeHashUT,
		bytes32 _codeHashVT
	)
	Owned()
	public
	{
		require(_token != address(0));
		//require(_gateway != address(0));
		require(_core != address(0));
		require(_codeHashUT != bytes32(0));
		require(_codeHashVT != bytes32(0));

		isActivated = false;
		token = _token;
		//gateway = _gateway;
		core = _core;
		bounty = _bounty;
		codeHashUT = _codeHashUT;

		// TODO: should we check the code hash with declared codeHash constants.
	}

	function confirmGatewayLinkIntent(
		address _gateway,
		bytes32 _intentHash,
		uint256 _gasPrice,
		uint256 _fee,
		uint256 _nonce,
		address _sender,
		bytes32 _hashLock,
		uint256 _blockHeight,
		bytes memory _rlpParentNodes
	)
	public
	returns(bytes32 messageHash_)
	{
		require(_sender == owner);
		require(_gateway != address(0));
		require(gatewayLink.messageHash == bytes32(0));
		require(nonces[_sender] == _nonce);

		bytes32 intentHash = keccak256(
			abi.encodePacked(_gateway,
			address(this),
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

		MessageBus.confirmMessage(
			messageBox,
			GATEWAY_LINK_TYPEHASH,
			gatewayLink.message,
			_rlpParentNodes,
			outboxOffset,
			core.getStorageRoot(_blockHeight));

		nonces[_sender]++;

		gateway = _gateway;
		emit GatewayLinkConfirmed(
			messageHash_,
			gateway,
			address(this),
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

		MessageBus.progressInbox(messageBox, GATEWAY_LINK_TYPEHASH, gatewayLink.message, _unlockSecret);

		// TODO: think about fee transfer

		isActivated = true;

		return true;
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
		bytes memory _rlpParentNodes
	)
	public
	returns (bytes32 messageHash_)
	{
		require(isActivated);
		require(_staker != address(0));
		require(_stakerNonce == nonces[_staker]);
		require(_beneficiary != address(0));
		require(_amount != 0);
		require(_fee != 0);
		require(_gasPrice != 0);
		require(_blockHeight != 0);
		require(_hashLock != bytes32(0));
		require(_rlpParentNodes.length != 0);

		require(cleanProcessedStakingRequest(_staker));

		//todo change to library call, stake too deep error
		bytes32 intentHash = keccak256(abi.encodePacked(_amount, _beneficiary, _staker, _gasPrice, _fee));

		messageHash_ = MessageBus.messageDigest(STAKE_REQUEST_TYPEHASH, intentHash, _stakerNonce, _gasPrice);

		activeRequests[_staker] = messageHash_;

		mints[messageHash_] = getMint(_amount,
			_beneficiary,
			_fee,
			_staker,
			_stakerNonce,
			_gasPrice,
			intentHash,
			_hashLock
		);

		executeConfirmStakingIntent(mints[messageHash_].message, _blockHeight, _rlpParentNodes);

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
		bytes32 _unlockSecret
	)
	external
	returns (
		uint256 mintRequestedAmount_,
		uint256 mintedAmount_,
		uint256 rewardAmount_
	)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		Mint storage mint = mints[_messageHash];
		MessageBus.Message storage message = mint.message;

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		mintRequestedAmount_ = mint.amount;
		rewardAmount_ = mint.fee.mul(message.gasPrice);

		mintedAmount_ = mint.amount.sub(rewardAmount_);
		//Mint token after subtracting fee
		require(UtilityTokenInterface(utilityToken).mint(mint.beneficiary, mintedAmount_));
		//reward beneficiary with the fee
		require(UtilityTokenInterface(utilityToken).mint(msg.sender, rewardAmount_));

		MessageBus.progressInbox(messageBox, STAKE_REQUEST_TYPEHASH, mint.message, _unlockSecret);

		emit MintProcessed(
			_messageHash,
			mint.amount,
			mint.beneficiary,
			rewardAmount_
		);
	}

	function confirmRevertStakingIntent(
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
		Mint storage mint = mints[_messageHash];
		MessageBus.Message storage message = mint.message;
		require(message.intentHash !=  bytes32(0));

		require(nonces[message.sender] == message.nonce + 1);

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		require(MessageBus.confirmRevocation(
				messageBox,
				STAKE_REQUEST_TYPEHASH,
				message,
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
		return true;
	}

	function redeem(
		uint256 _amount,
		address _beneficiary,
		address _redeemer,
		uint256 _gasPrice,
		uint256 _fee,
		uint256 _nonce,
		bytes32 _hashLock,
		bytes _signature
	)
	public
	returns (bytes32 messageHash_)
	{
		require(isActivated);
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_redeemer != address(0));
		require(_hashLock != bytes32(0));
		require(_signature.length != 0);
		require(nonces[msg.sender] == _nonce);
		require(cleanProcessedRedeemRequest(_redeemer));

		nonces[msg.sender]++;

		bytes32 intentHash = HasherV1.intentHash(_amount, _beneficiary, _redeemer, _gasPrice, _fee);

		messageHash_ = MessageBus.messageDigest(REDEEM_REQUEST_TYPEHASH, intentHash, _nonce, _gasPrice);

		activeRequests[_redeemer] = messageHash_;

		redeemRequests[messageHash_] = RedeemRequest({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee,
			message : getMessage(_redeemer, _nonce, _gasPrice, intentHash, _hashLock),
			facilitator : msg.sender
			});

		MessageBus.declareMessage(messageBox, REDEEM_REQUEST_TYPEHASH, redeemRequests[messageHash_].message, _signature);
		//transfer redeem amount to Co-Gateway
		require(EIP20Interface(utilityToken).transferFrom(_redeemer, this, _amount));
		//transfer bounty to Co-Gateway
		require(EIP20Interface(utilityToken).transferFrom(msg.sender, this, bounty));

		emit RedeemRequested(
			messageHash_,
			_amount,
			_fee,
			_beneficiary,
			_redeemer,
			intentHash
		);
	}

	function processRedemption(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (uint256 redeemAmount)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));
		MessageBus.Message storage message = redeemRequests[_messageHash].message;

		require(nonces[message.sender] == message.nonce + 1);

		nonces[message.sender]++;

		redeemAmount = redeemRequests[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, REDEEM_REQUEST_TYPEHASH, redeemRequests[_messageHash].message, _unlockSecret);

		require(utilityToken.burn(this, redeemAmount));

		//TODO: think around bounty
		require(EIP20Interface(utilityToken).transfer(msg.sender, bounty));

		emit RedeemProcessed(
			_messageHash,
			redeemAmount,
			redeemRequests[_messageHash].beneficiary,
			redeemRequests[_messageHash].fee
		);
	}

	function revertRedemption(
		bytes32 _messageHash,
		bytes _signature
	)
	external
	returns (
		address redeemer_,
		bytes32 intentHash_,
		uint256 nonce_,
		uint256 gasPrice_
	)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		MessageBus.Message storage message = redeemRequests[_messageHash].message;

		require(message.intentHash != bytes32(0));

		require(nonces[message.sender] == message.nonce + 1);

		require(
			MessageBus.declareRevocationMessage(
				messageBox,
				REDEEM_REQUEST_TYPEHASH,
				message,
				_signature
			)
		);

		redeemer_ = message.sender;
		intentHash_ = message.intentHash;
		nonce_ = nonces[message.sender];
		gasPrice_ = message.gasPrice;

		emit RevertRedeemRequested(_messageHash, redeemer_, intentHash_, nonces[message.sender], gasPrice_);
	}

	function processRevertRedemption(
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

		MessageBus.Message storage message = redeemRequests[_messageHash].message;
		require(message.intentHash != bytes32(0));

		require(nonces[message.sender] == message.nonce + 1);

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		require(
			MessageBus.progressRevocationMessage(
				messageBox,
				message,
				REDEEM_REQUEST_TYPEHASH,
				outboxOffset,
				_rlpEncodedParentNodes,
				storageRoot
			)
		);

		nonces[message.sender]++;

		RedeemRequest storage redeemRequest = redeemRequests[_messageHash];

		require(EIP20Interface(utilityToken).transfer(message.sender, redeemRequest.amount));
		require(EIP20Interface(utilityToken).transfer(redeemRequests[_messageHash].facilitator, bounty));

		emit RedeemReverted(
			message.sender,
			redeemRequest.amount,
			redeemRequest.beneficiary,
			redeemRequest.fee,
			message.gasPrice);
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
		bytes32 _hashLock
	)
	private
	pure
	returns (MessageBus.Message)
	{
		return MessageBus.Message({
			intentHash : _intentHash,
			nonce : _stakerNonce,
			gasPrice : _gasPrice,
			sender : _staker,
			hashLock : _hashLock
			});
	}

	function getMint(
		uint256 _amount,
		address _beneficiary,
		uint256 _fee,
		address _staker,
		uint256 _stakerNonce,
		uint256 _gasPrice,
		bytes32 _intentHash,
		bytes32 _hashLock
	)
	private
	pure
	returns (Mint)
	{
		return Mint({
			amount : _amount,
			beneficiary : _beneficiary,
			fee : _fee,
			message : getMessage(_staker, _stakerNonce, _gasPrice, _intentHash, _hashLock)
			});
	}

	function cleanProcessedRedeemRequest(address redeemer)
	private
	returns (bool /*success*/)
	{
		bytes32 previousRequest = activeRequests[redeemer];

		if (previousRequest != bytes32(0)) {

			require(
				messageBox.outbox[previousRequest] != MessageBus.MessageStatus.Progressed ||
				messageBox.outbox[previousRequest] != MessageBus.MessageStatus.Revoked
			);
			delete redeemRequests[previousRequest];
			delete messageBox.inbox[previousRequest];
		}
	}

	function cleanProcessedStakingRequest(address staker)
	private
	returns (bool /*success*/)
	{
		bytes32 previousRequest = activeRequests[staker];

		if (previousRequest != bytes32(0)) {

			require(
				messageBox.inbox[previousRequest] != MessageBus.MessageStatus.Progressed ||
				messageBox.inbox[previousRequest] != MessageBus.MessageStatus.Revoked
			);
			delete mints[previousRequest];
			delete messageBox.inbox[previousRequest];
		}
		return true;
	}
}
