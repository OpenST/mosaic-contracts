pragma solidity ^0.4.23;

import "./WorkersInterface.sol";

contract GatewayV1 {

	//uuid of branded token
	bytes32 public uuid;
	//Escrow address
	address stakeVault;
	//amount in BT which is staked by facilitator
	uint256 public bounty;
	//white listed addresses which can act as facilitator
	WorkersInterface public workers;

	//address of branded token
	address public brandedToken;
	//address of message bus library
	address public messageBus;

	/**
	 *  @notice Contract constructor.
	 *
	 *  @param  _uuid UUID of utility token.
	 *  @param _bounty Bounty amount that worker address stakes while accepting stake request.
	 *  @param _workers Workers contract address.
	 *  @param _brandedToken Branded token contract address.
	 *  @param _messageBus Message bus library address.
	 */
	constructor(
		bytes32 _uuid,
		uint256 _bounty,
		address _workers,
		address _brandedToken,
		address _messageBus
	)
	{
		uuid = _uuid;
		bounty = _bounty;
		workers = _workers;
		brandedToken = _brandedToken;
		messageBus = _messageBus;
		stakeVault = new SimpleStake(brandedToken, address(this), uuid);
	}
}
