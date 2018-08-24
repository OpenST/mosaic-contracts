pragma solidity ^0.4.23;

contract CoGatewayV1Interface {

    function token() external returns (address);
    function gateway() external returns (address);
    function codeHashUT() external returns (bytes32);
    function codeHashVT() external returns (bytes32);
    function organisation() external returns (address);
    function isActivated() external returns (bool);
    function bounty() external returns (uint256);
    function core() external returns (address);
    function utilityToken() external returns (address);

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
	returns(bytes32 messageHash_);

	function processGatewayLink(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (bool /*TBD*/);

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
	returns (bytes32 messageHash_);

	function processMinting(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (
		uint256 mintRequestedAmount_,
		uint256 mintedAmount_,
		uint256 rewardAmount_
	);

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
	);

	function confirmRevertStakingIntent(
		bytes32 _messageHash,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes
	)
	external
	returns (bool /*TBD*/);

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
	returns (bytes32 messageHash_);

	function processRedemption(
		bytes32 _messageHash,
		bytes32 _unlockSecret
	)
	external
	returns (uint256 redeemAmount);

	function processRedemptionWithProof(
		bytes32 _messageHash,
		bytes _rlpEncodedParentNodes,
		uint256 _blockHeight,
		uint256 _messageStatus
	)
	external
	returns (uint256 redeemAmount);

	function revertRedemption(
		bytes32 _messageHash
	)
	external
	returns (
		address redeemer_,
		bytes32 intentHash_,
		uint256 nonce_,
		uint256 gasPrice_
	);

	function processRevertRedemption(
		bytes32 _messageHash,
		uint256 _blockHeight,
		bytes _rlpEncodedParentNodes
	)
	external
	returns (bool /*TBD*/);

}
