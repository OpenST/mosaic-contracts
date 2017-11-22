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
// contracts/utilityChain/OpenSTUtility.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../SafeMath.sol";
import "../Hasher.sol";
import "../OpsManaged.sol";
import "../CoreInterface.sol";
import "./STPrime.sol";
import "./STPrimeConfig.sol";
import "./BrandedToken.sol";

/// @title OpenST Utility
contract OpenSTUtility is Hasher, OpsManaged {
	using SafeMath for uint256;

	/*
	 *  Structures
	 */
	struct RegisteredBrandedToken {
		address tokenAddress;
		address registrar;
	}

	/*
	 *	Events
	 */
	event RequestedBrandedToken(address indexed _requester, address indexed _token,
		bytes32 _uuid, string _symbol, string _name, uint256 _conversionRate);

	/*
	 *  Constants
	 */
	string  public constant STPRIME_SYMBOL = "STP";
    string public constant STPRIME_NAME = "SimpleTokenPrime";
    uint8 public constant TOKEN_DECIMALS = 18;
    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
	// ~2 weeks, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_LONG = 80667;
	// ~1hour, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_SHORT = 240;

	/*
	 *  Storage
	 */
	// mapping()
	/// store address of Simple Token Prime
	address public simpleTokenPrime;
	bytes32 public uuidSTPrime;
	/// restrict (for now) to a single value chain
	uint256 public chainIdValue;
	/// chainId of the current utility chain
	uint256 public chainIdUtility;
	address public registrar;
	/// registered branded tokens 
	mapping(bytes32 /* uuid */ => RegisteredBrandedToken) public registeredBrandedTokens;
	/// name reservation is first come, first serve
	mapping(bytes32 /* hashName */ => address /* requester */) public nameReservation;
	/// symbol reserved for unique API routes
	/// and resolves to address
	mapping(bytes32 /* hashSymbol */ => address /* BrandedToken */) public symbolRoute;
	
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
	function OpenSTUtility(
		uint256 _chainIdValue,
		uint256 _chainIdUtility,
		address _registrar)
		public
		OpsManaged()
	{
		require(_chainIdValue != 0);
		require(_chainIdUtility != 0);
		require(_registrar != address(0));

		chainIdValue = _chainIdValue;
		chainIdUtility = _chainIdUtility;
		registrar = _registrar;

		uuidSTPrime = hashUuid(
			STPRIME_SYMBOL,
			STPRIME_NAME,
			_chainIdValue,
			_chainIdUtility,
			address(this),
			1);
		simpleTokenPrime = new STPrime(
			address(this),
			uuidSTPrime);

		// TODO
	}

	function proposeBrandedToken(
		string _symbol,
		string _name,
		uint256 _conversionRate)
		public
		returns (bytes32)
	{
		require(bytes(_symbol).length > 0);
		require(bytes(_name).length > 0);
		require(_conversionRate > 0);

		bytes32 hashSymbol = keccak256(_symbol);
		bytes32 hashName = keccak256(_name);
		require(checkAvailability(hashSymbol, hashName, msg.sender));

		bytes32 btUuid = hashUuid(
			_symbol,
			_name,
			chainIdValue,
			chainIdUtility,
			address(this),
			_conversionRate);

		BrandedToken proposedBT = new BrandedToken(
			address(this),
			btUuid,
			_symbol,
			_name,
			TOKEN_DECIMALS);
		// reserve name for sender under opt-in discretion of
		// registrar
		nameReservation[hashName] = msg.sender;

		RequestedBrandedToken(msg.sender, address(proposedBT), btUuid,
			_symbol, _name, _conversionRate);

		return btUuid;
	}


	function checkAvailability(
		bytes32 _hashSymbol,
		bytes32 _hashName,
		address _requester)
		public
		view
		returns (bool /* success */)
	{
		// a reserved symbol means the route is already chosen
		address token = symbolRoute[_hashSymbol];
		if (token != address(0)) return false;

		// a name can have been reserved during the Simple Token sale
		// in which case must come from same address
		// otherwise proposals are first come, first serve
		// under opt-in discretion of registrar
		address requester = nameReservation[_hashName]; 
		if ((requester == address(0) ||
			requester == _requester)) {
			return true;
		}
		return false;
	}

	/*
	 *  Registrar functions
	 */
	/// @dev for v0.9.1 tracking Ethereum mainnet on the utility chain
	///      is not a required feature yet, so the core is simplified
	///      to uint256 valueChainId as storage on construction
	// function addCore(
	// 	CoreInterface _core)
	// 	public
	// 	onlyRegistrar
	// 	returns (bool /* success */)
	// {
	// 	require(address(_core) != address(0));
	// 	// core constructed with same registrar
	// 	require(registrar == _core.registrar());
	// 	// on utility chain core only tracks a remote value chain
	// 	uint256 coreChainIdValue = _core.chainIdRemote();
	// 	require(chainIdUtility != 0);
	// 	// cannot overwrite core for given chainId
	// 	require(cores[coreChainIdValue] == address(0));

	// 	cores[coreChainIdValue] = _core;

	// 	return true;
	// }

	function registerBrandedToken(
		string _symbol,
		string _name,
		uint256 _conversionRate,
		address _requester,
		bytes32 _checkUuid)
		public
		onlyRegistrar
		returns (bytes32 uuid)
	{
		require(bytes(_symbol).length > 0);
		require(bytes(_name).length > 0);
		require(_conversionRate > 0);

		bytes32 hashSymbol = keccak256(_symbol);
		bytes32 hashName = keccak256(_name);
		require(checkAvailability(hashSymbol, hashName, _requester));

		uuid = hashUuid(
			_symbol,
			_name,
			chainIdValue,
			chainIdUtility,
			address(this),
			_conversionRate);

		require(uuid == _checkUuid);

		// ...

		return uuid;
	}

	/*
	 *  Operation functions
	 */
	/// @dev TODO: add events to trigger for each action

	function addNameReservation(
		bytes32 _hashName,
		address _requester)
		public
		onlyAdminOrOps
		returns (bool /* success */)
	{
		address requester = nameReservation[_hashName]; 
		if (requester == _requester) return true;
		if (requester == address(0)) {
			nameReservation[_hashName] = _requester;
			return true;
		}
		return false;
	}

	function setSymbolRoute(
		bytes32 _hashSymbol,
		address _token)
		public
		onlyAdminOrOps
		returns (bool /* success */)
	{
		address token = symbolRoute[_hashSymbol];
		if (token == _token) return true;
		if (token == address(0)) {
			symbolRoute[_hashSymbol] = _token;
			return true;
		}
		return false;
	}

	function removeNameReservation(
		bytes32 _hashName)
		public
		onlyAdminOrOps
		returns (bool /* success */)
	{
		require(nameReservation[_hashName] != address(0));

		delete nameReservation[_hashName];
		return true;
	}

	function removeSymbolRoute(
		bytes32 _hashSymbol)
		public
		onlyAdminOrOps
		returns (bool /* success */)
	{
		require(symbolRoute[_hashSymbol] != address(0));

		delete symbolRoute[_hashSymbol];
		return true;
	}
}