pragma solidity ^0.4.23;

contract CoGatewayUtilityTokenInterface {
	event CoGatewaySet(
		address _utilityToken,
		uint256 _coGateway
	);

	function utilityToken() public returns (address);
}
