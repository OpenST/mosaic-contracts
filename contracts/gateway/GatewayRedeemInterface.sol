pragma solidity ^0.5.0;

contract GatewayRedeemInterface {

    function isActivated() external returns (bool);
    function bounty() external returns (uint256);

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
        bytes calldata _rlpEncodedParentNodes,
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
        bytes calldata _rlpEncodedParentNodes
    )
        external
        returns (bool /*TBD*/);

}
