pragma solidity ^0.5.0;

contract StakerProxy {

    constructor(address _composer, address staker) public {
        
    }

    function stake(
        uint256 _amount,
        address _beneficiary,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _nonce,
        bytes32 hashLock,
        address _gateway
    )
        public
        returns (bytes32 messageHash_)
    {

    }

}