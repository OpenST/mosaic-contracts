pragma solidity ^0.4.17;

// Copyright 2017 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// OpenST - Value staking contract for OpenST Platform v0.9 on value chain
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../SafeMath.sol";
import "../Hasher.sol";
import "../OpsManaged.sol";
import "../EIP20Interface.sol";
import "../CoreInterface.sol";
import "./SimpleStake.sol";

/// @title OpenSTValue - value staking contract for OpenST 
/// @notice 
contract OpenSTValue is OpsManaged, Hasher {
	using SafeMath for uint256;

	/*
	 *  Events
	 */
    event UtilityTokenRegistered(bytes32 indexed _uuid, address indexed stake,
    	string _symbol, string _name, uint8 _decimals, uint256 _conversionRate,
    	uint256 _chainIdUtility, address indexed _stakingAccount);

	/*
	 *  Constants
	 */
    uint8 public constant TOKEN_DECIMALS = 18;
    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
	// ~2 weeks, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_LONG = 80667;
	// ~1hour, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_SHORT = 240;

    /*
     *  Structures
     */
    struct UtilityToken {
    	string  symbol;
    	string  name;
    	uint256 conversionRate;
    	uint8   decimals;
    	uint256 chainIdUtility;
    	address simpleStake;
    	address stakingAccount;
    	mapping(bytes32 /* hashStakingIntent */ => Stake) stakes;
    	mapping(bytes32 /* hashRedemptionIntent */ => Unstake) unstakes;
    }

    struct Stake {
    	address staker;
    	address beneficiary;
    	uint256 amountST;
    	uint256 amountUT;
    	uint256 escrowUnlockHeight;
    }

    struct Unstake {
    	address unstaker;
    	uint256 amount;
    }

	/*
	 *  Storage
	 */
 	uint256 public chainIdValue;
 	EIP20Interface public valueToken;
 	address public registrar;
	mapping(uint256 /* chainIdUtility */ => CoreInterface) cores;
	mapping(bytes32 /* uuid */ => UtilityToken) utilityTokens;

	/*
	 *  Modifiers
	 */
	modifier onlyRegistrar() {
		// for now keep unique registrar
		require(msg.sender == registrar);
		_;
	}

	/*
	 *  Public functions
	 */
	function OpenSTValue(
		uint256 _chainIdValue,
		EIP20Interface _eip20token,
		address _registrar)
		public
		OpsManaged()
	{
		require(_chainIdValue != 0);
		require(_eip20token != address(0));
		require(_registrar != address(0));

		chainIdValue = _chainIdValue;
		valueToken = _eip20token;
		// registrar cannot be reset
		// TODO: require it to be a contract
		registrar = _registrar;
	}

	/// @dev In order to stake the tx.origin needs to set an allowance
	///      for the OpenSTValue contract to transfer to itself to hold
	///      during the staking process.
	// function stake(
	// 	)


	/*
	 *  Registrar functions
	 */
	function addCore(
		CoreInterface _core)
		public
		onlyRegistrar
		returns (bool /* success */)
	{
		require(address(_core) != address(0));
		// core constructed with same registrar
		require(registrar == _core.registrar());
		// on value chain core only tracks a remote utility chain
		uint256 chainIdUtility = _core.chainIdRemote();
		require(chainIdUtility != 0);
		// cannot overwrite core for given chainId
		require(cores[chainIdUtility] == address(0));

		cores[chainIdUtility] = _core;

		return true;
	}

	function registerUtilityToken(
		string _symbol,
		string _name,
		uint256 _conversionRate,
		uint256 _chainIdUtility,
		address _stakingAccount,
		bytes32 _checkUuid)
		public
		onlyRegistrar
		returns (bytes32 uuid)
	{
		require(bytes(_name).length > 0);
		require(bytes(_symbol).length > 0);
		require(_conversionRate > 0);

		address openSTRemote = cores[_chainIdUtility].openSTRemote();
		require(openSTRemote != address(0));

		uuid = hashUuid(
			_symbol,
			_name,
			chainIdValue,
			_chainIdUtility,
			openSTRemote,
			_conversionRate);

		require(uuid == _checkUuid);

		SimpleStake simpleStake = new SimpleStake(
			valueToken, address(this), uuid);

		utilityTokens[uuid] = UtilityToken({
			symbol:         _symbol,
			name:           _name,
			conversionRate: _conversionRate,
			decimals:       TOKEN_DECIMALS,
			chainIdUtility: _chainIdUtility,
			simpleStake:    address(simpleStake),
			stakingAccount: _stakingAccount
		});

		UtilityTokenRegistered(uuid, address(simpleStake), _symbol, _name, 
			TOKEN_DECIMALS, _conversionRate, _chainIdUtility, _stakingAccount);

		return uuid;
	}
}