pragma solidity ^0.4.23;

import "./WorkersInterface.sol";
import "./EIP20Interface.sol";
import "./SimpleStake.sol";

contract GatewayV1 {

	//uuid of branded token
	bytes32 public uuid;
	//Escrow address to lock staked fund
	address stakeVault;
	//amount in BT which is staked by facilitator
	uint256 public bounty;
	//white listed addresses which can act as facilitator
	WorkersInterface public workers;

	//address of branded token
	EIP20Interface public brandedToken;
	//address of message bus library
	address public messageBus;

	mapping(address/*staker*/ => uint256) nonces;

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
		WorkersInterface _workers,
		EIP20Interface _brandedToken,
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


	function stake(
		uint256 _amount,
		address _beneficiary,
		address _staker,
		bytes32 _hashLock,
		bytes32 _intentHash,
		bytes _signature
	)
	{
		require(_amount > uint256(0));
		require(_beneficiary != address(0));
		require(_staker != address(0));
		require(_hashLock != bytes32(0));
		require(_intentHash != bytes32(0));
		require(_signature != bytes(0));


		bytes32 r;
		bytes32 s;
		uint8 v;
		(r, s, v) = fetchSignatureComponents(_signature);

	}

	
	function fetchSignatureComponents(bytes _signature)
	private
	returns (
		bytes32 r,
		bytes32 s,
		uint8 v
	)
	{
		assembly {
			r := mload(add(_signature, 32))
			s := mload(add(_signature, 64))
			v := byte(0, mload(add(_signature, 96)))
		}
		// Version of signature should be 27 or 28, but 0 and 1 are also possible versions
		if (v < 27) {
			v += 27;
		}
	}
}
