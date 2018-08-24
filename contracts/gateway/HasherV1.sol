pragma solidity ^0.4.23;

library HasherV1 {

	function intentHash(
		uint256 _amount,
		address _beneficiary,
		address _sender,
		uint256 _gasPrice
	)
	external
	pure
	returns (bytes32 /*hash*/){

		return keccak256(abi.encodePacked(_amount, _beneficiary, _sender, _gasPrice));

	}
}
