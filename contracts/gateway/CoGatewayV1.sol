pragma solidity ^0.4.23;

import "./MessageBus.sol";
import "./CoreInterface.sol";
import "./EIP20Interface.sol";
import "./UtilityTokenAbstract.sol";
import "./HasherV1.sol";

contract CoGatewayV1 {

	using SafeMath for uint256;

	event  StakingIntentConfirmed(
		bytes32 messageHash,
		address staker,
		uint256 stakerNonce,
		address beneficiary,
		uint256 amount,
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
		address beneficiary,
		address redeemer,
		bytes32 intentHash
	);

	event RedeemProcessed(
		bytes32 messageHash,
		uint256 amount,
		address beneficiary
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
		uint256 gasPrice
	);

	struct Mint {
		uint256 amount;
		address beneficiary;
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
	 */
	struct RedeemRequest {
		uint256 amount;
		address beneficiary;
		MessageBus.Message message;
		address facilitator;
	}

	struct GatewayLink {
		bytes32 messageHash;
		MessageBus.Message message;
	}


	bytes32 constant STAKE_REQUEST_TYPEHASH = keccak256(
		abi.encode(
			"StakeRequest(uint256 amount,address beneficiary,MessageBus.Message message)"
		)
	);

	bytes32 constant REDEEM_REQUEST_TYPEHASH = keccak256(
		abi.encode(
			"RedeemRequest(uint256 amount,address beneficiary,MessageBus.Message message)"
		)
	);
	bytes32 constant GATEWAY_LINK_TYPEHASH =  keccak256(
		abi.encode(
			"GatewayLink(bytes32 messageHash,MessageBus.Message message)"
		)
	);

	address private token;
	address private gateway;
	bytes32 private codeHashUT;
	bytes32 private codeHashVT;
	address private organisation;
	bool private isActivated;
	GatewayLink gatewayLink;
	uint256 private bounty;
	MessageBus.MessageBox messageBox;
	uint8 outboxOffset = 4;
	CoreInterface private core;
	UtilityTokenInterface  private utilityToken;

	uint256 constant GAS_LIMIT = 2000000; //TODO: Decide this later (May be we should have different gas limits. TO think)
	mapping(bytes32 /*requestHash*/ => Mint) mints;
	mapping(bytes32/*messageHash*/ => RedeemRequest) redeemRequests;
	mapping(address /*redeemer*/ => bytes32 /*messageHash*/) activeRequests;

	modifier onlyOrganisation() {
		require(msg.sender == organisation);
		_;
	}

	constructor(
		EIP20Interface _token,
		CoreInterface _core,
		uint256 _bounty,
		bytes32 _codeHashUT,
		bytes32 _codeHashVT,
		address _organisation
	)
	public
	{
		require(_token != address(0));
		//require(_gateway != address(0));
		require(_core != address(0));
		require(_codeHashUT != bytes32(0));
		require(_codeHashVT != bytes32(0));
		require(_organisation != address(0));

		isActivated = false;
		token = _token;
		//gateway = _gateway;
		core = _core;
		bounty = _bounty;
		codeHashUT = _codeHashUT;
		organisation = _organisation;

		// TODO: should we check the code hash with declared codeHash constants.
	}

	function confirmGatewayLinkIntent(
		address _gateway,
		bytes32 _intentHash,
		uint256 _gasPrice,
		uint256 _nonce,
		address _sender,
		bytes32 _hashLock,
		uint256 _blockHeight,
		bytes memory _rlpParentNodes
	)
	public
	returns(bytes32 messageHash_)
	{
		require(_sender == organisation);
		require(_gateway != address(0));
		require(gatewayLink.messageHash == bytes32(0));

		bytes32 intentHash = keccak256(
			abi.encodePacked(_gateway,
			address(this),
			bounty,
			codeHashUT,
			codeHashVT,
			MessageBus.getCodeHash(),
			_gasPrice,
			_nonce
			)
		);

		require(intentHash == _intentHash);

		messageHash_ = MessageBus.messageDigest(GATEWAY_LINK_TYPEHASH, intentHash, _nonce, _gasPrice);

		gatewayLink = GatewayLink ({
			messageHash: messageHash_,
			message: getMessage(
				_sender,
				_nonce,
				_gasPrice,
				_intentHash, _hashLock
				)
			});


		MessageBus.confirmMessage(
			messageBox,
			GATEWAY_LINK_TYPEHASH,
			gatewayLink.message,
			_rlpParentNodes,
			outboxOffset,
			core.getStorageRoot(_blockHeight));

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
		uint256 _gasPrice,
		uint256 _blockHeight,
		bytes32 _hashLock,
		bytes memory _rlpParentNodes
	)
	public
	returns (bytes32 messageHash_)
	{
		uint256 initialGas = gasleft();
		require(isActivated);
		require(_staker != address(0));
		require(_beneficiary != address(0));
		require(_amount != 0);
		require(_gasPrice != 0);
		require(_blockHeight != 0);
		require(_hashLock != bytes32(0));
		require(_rlpParentNodes.length != 0);

		require(cleanProcessedStakingRequest(_staker));

		//todo change to library call, stake too deep error
		bytes32 intentHash = keccak256(abi.encodePacked(_amount, _beneficiary, _staker, _gasPrice));

		messageHash_ = MessageBus.messageDigest(STAKE_REQUEST_TYPEHASH, intentHash, _stakerNonce, _gasPrice);

		activeRequests[_staker] = messageHash_;

		mints[messageHash_] = getMint(_amount,
			_beneficiary,
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
			_blockHeight,
			_hashLock
		);

		mints[messageHash_].message.gasConsumed = gasleft().sub(initialGas);
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
		uint256 initialGas = gasleft();
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_unlockSecret != bytes32(0));

		Mint storage mint = mints[_messageHash];
		MessageBus.Message storage message = mint.message;

		MessageBus.progressInbox(messageBox, STAKE_REQUEST_TYPEHASH, mint.message, _unlockSecret);

		mintRequestedAmount_ = mint.amount;

		rewardAmount_ = MessageBus.feeAmount(message, initialGas, 50000, GAS_LIMIT); //21000 * 2 for transactions + approx buffer

		mintedAmount_ = mint.amount.sub(rewardAmount_);
		//Mint token after subtracting reward amount
		require(UtilityTokenInterface(utilityToken).mint(mint.beneficiary, mintedAmount_));
		//reward beneficiary with the reward amount
		require(UtilityTokenInterface(utilityToken).mint(msg.sender, rewardAmount_));


		emit MintProcessed(
			_messageHash,
			mint.amount,
			mint.beneficiary,
			rewardAmount_
		);
	}

	function processMintingWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
	public
	returns (
		uint256 mintRequestedAmount_,
		uint256 mintedAmount_,
		uint256 rewardAmount_
	)
	{
		uint256 initialGas = gasleft();
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		Mint storage mint = mints[_messageHash];
		MessageBus.Message storage message = mint.message;

		MessageBus.progressInboxWithProof(messageBox,
			STAKE_REQUEST_TYPEHASH,
			mint.message,
			_rlpEncodedParentNodes,
			outboxOffset,
			storageRoot,
			MessageBus.MessageStatus(_messageStatus));

		mintRequestedAmount_ = mint.amount;
		rewardAmount_ = MessageBus.feeAmount(message, initialGas, 50000, GAS_LIMIT); //21000 * 2 for transactions + approx buffer

		mintedAmount_ = mint.amount.sub(rewardAmount_);
		//Mint token after subtracting reward amount
		require(UtilityTokenInterface(utilityToken).mint(mint.beneficiary, mintedAmount_));
		//reward beneficiary with the reward amount
		require(UtilityTokenInterface(utilityToken).mint(msg.sender, rewardAmount_));

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

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
		uint256 initialGas = gasleft();
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);
		Mint storage mint = mints[_messageHash];
		MessageBus.Message storage message = mint.message;
		require(message.intentHash !=  bytes32(0));

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
			message.nonce,
			_blockHeight
		);
		message.gasConsumed = gasleft().sub(initialGas);
		return true;
	}

	function redeem(
		uint256 _amount,
		address _beneficiary,
		address _facilitator,
		uint256 _gasPrice,
		uint256 _nonce,
		bytes32 _hashLock
	)
	public
	payable
	returns (bytes32 messageHash_)
	{
		require(isActivated);
		require(msg.value == bounty);
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_facilitator != address(0));
		require(_hashLock != bytes32(0));
		require(cleanProcessedRedeemRequest(msg.sender));

		bytes32 intentHash = HasherV1.intentHash(_amount, _beneficiary, msg.sender, _gasPrice);

		messageHash_ = MessageBus.messageDigest(REDEEM_REQUEST_TYPEHASH, intentHash, _nonce, _gasPrice);

		activeRequests[msg.sender] = messageHash_;

		redeemRequests[messageHash_] = RedeemRequest({
			amount : _amount,
			beneficiary : _beneficiary,
			message : getMessage(msg.sender, _nonce, _gasPrice, intentHash, _hashLock),
			facilitator : _facilitator
			});

		//New implementation changing the state here
		require(messageBox.outbox[messageHash_] == MessageBus.MessageStatus.Undeclared);
		messageBox.outbox[messageHash_] = MessageBus.MessageStatus.Declared;

		//transfer redeem amount to Co-Gateway
		require(EIP20Interface(utilityToken).transferFrom(msg.sender, this, _amount));

		emit RedeemRequested(
			messageHash_,
			_amount,
			_beneficiary,
			msg.sender,
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

		redeemAmount = redeemRequests[_messageHash].amount;

		MessageBus.progressOutbox(messageBox, REDEEM_REQUEST_TYPEHASH, message, _unlockSecret);

		require(utilityToken.burn(this, redeemAmount));

		msg.sender.transfer(bounty);

		emit RedeemProcessed(
			_messageHash,
			redeemAmount,
			redeemRequests[_messageHash].beneficiary
		);
	}


	function processRedemptionWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
	external
	returns (uint256 redeemAmount)
	{
		require(isActivated);
		require(_messageHash != bytes32(0));
		require(_rlpEncodedParentNodes.length > 0);

		redeemAmount = redeemRequests[_messageHash].amount;

		bytes32 storageRoot = core.getStorageRoot(_blockHeight);
		require(storageRoot != bytes32(0));

		MessageBus.progressOutboxWithProof(
			messageBox,
			REDEEM_REQUEST_TYPEHASH,
			redeemRequests[_messageHash].message,
			_rlpEncodedParentNodes,
			outboxOffset,
			storageRoot,
			MessageBus.MessageStatus(_messageStatus)
		);

		require(utilityToken.burn(this, redeemAmount));

		//TODO: think around bounty
		require(EIP20Interface(utilityToken).transfer(redeemRequests[_messageHash].facilitator, bounty));

		emit RedeemProcessed(
			_messageHash,
			redeemAmount,
			redeemRequests[_messageHash].beneficiary
		);
	}

	function revertRedemption(
		bytes32 _messageHash
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

		require(message.sender == msg.sender);

		//New implementation changing the state here as we dont have signature verification
		require(messageBox.outbox[_messageHash] == MessageBus.MessageStatus.Undeclared);
		messageBox.outbox[_messageHash] = MessageBus.MessageStatus.Declared;

		redeemer_ = message.sender;
		intentHash_ = message.intentHash;
		nonce_ = message.nonce;
		gasPrice_ = message.gasPrice;

		emit RevertRedeemRequested(_messageHash, redeemer_, intentHash_, message.nonce, gasPrice_);
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

		RedeemRequest storage redeemRequest = redeemRequests[_messageHash];

		require(EIP20Interface(utilityToken).transfer(message.sender, redeemRequest.amount));

		msg.sender.transfer(bounty);

		emit RedeemReverted(
			message.sender,
			redeemRequest.amount,
			redeemRequest.beneficiary,
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
			hashLock : _hashLock,
			gasConsumed: 0
			});
	}

	function getMint(
		uint256 _amount,
		address _beneficiary,
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
