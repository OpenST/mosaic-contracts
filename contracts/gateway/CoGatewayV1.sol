pragma solidity ^0.4.23;

import "./EIP20Interface.sol";
import "./WorkersInterface.sol";
import "./CoreInterface.sol";
import "./Gateway.sol"; // this will become GatewayInterface.sol

contract CoGatewayV1 {

	constructor(
		Gateway _gateway,
		EIP20Interface _brandedToken,
		WorkersInterface _workers,
		CoreInterface _core,
		uint256 _bounty
	)
	public
	{
		require(_gateway != address(0));
		require(_brandedToken != address(0));
		require(_workers != address(0));
		require(_core != address(0));

		// todo: verify if the Gateway is for same EIP20Token.

	}
}
