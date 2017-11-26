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
// Utility chain: OpenSTUtility
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./Hasher.sol";
import "./OpsManaged.sol";
import "./CoreInterface.sol";

// utility chain contracts
import "./STPrime.sol";
import "./STPrimeConfig.sol";
import "./BrandedToken.sol";

/// @title OpenST Utility
contract OpenSTUtility is Hasher, OpsManaged {
	using SafeMath for uint256;

	/*
	 *  Structures
	 */
	struct RegisteredToken {
		UtilityTokenInterface token;
		address registrar;
	}


	struct Mint {
		bytes32 uuid;
		address staker;
		address beneficiary;
		uint256 amount;
		uint256 unlockHeight;
	}

	struct Redemption {
		bytes32 uuid;
		address redeemer;
		uint256 amountUT;
		uint256 escrowUnlockHeight;
	}
	/*
	 *	Events
	 */
	event RequestedBrandedToken(address indexed _requester, address indexed _token,
		bytes32 _uuid, string _symbol, string _name, uint256 _conversionRate);
	event RegisteredBrandedToken(address indexed _registrar, address indexed _token,
		bytes32 _uuid, string _symbol, string _name, uint256 _conversionRate, address _requester);
    event StakingIntentConfirmed(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash,
    	address _staker, address _beneficiary, uint256 _amountST, uint256 _amountUT, uint256 _unlockHeight);
    event ProcessedMint(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash, address _token,
    	address _staker, address _beneficiary, uint256 _amount);
	event RedemptionIntentDeclared(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash,
		address _token, address _redeemer, uint256 _nonce, uint256 _amount, uint256 _unlockHeight,
		uint256 _chainIdValue);

	/*
	 *  Constants
	 */
	string public constant STPRIME_SYMBOL = "STP";
    string public constant STPRIME_NAME = "SimpleTokenPrime";
    uint256 public constant STPRIME_CONVERSION_RATE = 1;
    uint8 public constant TOKEN_DECIMALS = 18;
    uint256 public constant DECIMALSFACTOR = 10**uint256(TOKEN_DECIMALS);
	// ~2 weeks, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_LONG = 80667;
	// ~1hour, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_SHORT = 240;

	/*
	 *  Storage
	 */
	/// store address of Simple Token Prime
	address public simpleTokenPrime;
	bytes32 public uuidSTPrime;
	/// restrict (for now) to a single value chain
	uint256 public chainIdValue;
	/// chainId of the current utility chain
	uint256 public chainIdUtility;
	address public registrar;
	/// registered branded tokens 
	mapping(bytes32 /* uuid */ => RegisteredToken) public registeredTokens;
	/// name reservation is first come, first serve
	mapping(bytes32 /* hashName */ => address /* requester */) public nameReservation;
	/// symbol reserved for unique API routes
	/// and resolves to address
	mapping(bytes32 /* hashSymbol */ => address /* UtilityToken */) public symbolRoute;
	/// nonce makes the staking process atomic across the two-phased process
	/// and protects against replay attack on (un)staking proofs during the process.
	/// On the value chain nonces need to strictly increase by one; on the utility
	/// chain the nonce need to strictly increase (as one value chain can have multiple
	/// utility chains)
	mapping(address /* (un)staker */ => uint256) nonces;
	/// store the ongoing mints and redemptions
	mapping(bytes32 /* stakingIntentHash */ => Mint) mints;
	mapping(bytes32 /* redemptionIntentHash*/ => Redemption) redemptions;

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
			STPRIME_CONVERSION_RATE);
		simpleTokenPrime = new STPrime(
			address(this),
			uuidSTPrime);

		registeredTokens[uuidSTPrime] = RegisteredToken({
			token:     UtilityTokenInterface(simpleTokenPrime),
			registrar: registrar
		});

		// lock name and symbol route for ST'
		bytes32 hashName = keccak256(STPRIME_NAME);
		nameReservation[hashName] = registrar;
		bytes32 hashSymbol = keccak256(STPRIME_SYMBOL);
		symbolRoute[hashSymbol] = simpleTokenPrime;

		// @dev read STPrime address and uuid from contract
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
		BrandedToken _brandedToken,
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
		require(_brandedToken.uuid() == _checkUuid);

		assert(address(registeredTokens[uuid].token) == address(0)); 
		
		registeredTokens[uuid] = RegisteredToken({
			token:     _brandedToken,
			registrar: registrar
		});

		// register name to registrar
		nameReservation[hashName] = registrar;
		// register symbol
		symbolRoute[hashSymbol] = _brandedToken;

		RegisteredBrandedToken(registrar, _brandedToken, uuid, _symbol, _name,
			_conversionRate, _requester);
		
		return uuid;
	}

	function confirmStakingIntent(
		bytes32 _uuid,
		address _staker,
		uint256 _stakerNonce,
		address _beneficiary,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _stakingUnlockHeight,
		bytes32 _stakingIntentHash)
		external
		onlyRegistrar
		returns (uint256 unlockHeight)
	{
		require(address(registeredTokens[_uuid].token) != address(0));

		require(nonces[_staker] < _stakerNonce);
		require(_amountST > 0);
		require(_amountUT > 0);
		// escrowunlockheight needs to be checked against the core that tracks the value chain
		require(_stakingUnlockHeight > 0);
		require(_stakingIntentHash != "");

		unlockHeight = block.number + BLOCKS_TO_WAIT_SHORT;
		nonces[_staker] = _stakerNonce;

		bytes32 stakingIntentHash = hashStakingIntent(
			_uuid,
			_staker,
			_stakerNonce,
			_beneficiary,
			_amountST,
			_amountUT,
			_stakingUnlockHeight
		);

		require(stakingIntentHash == _stakingIntentHash);

		mints[stakingIntentHash] = Mint({
			uuid:         _uuid,
			staker:       _staker,
			beneficiary:  _beneficiary,
			amount:       _amountUT,
			unlockHeight: unlockHeight
		});

    	StakingIntentConfirmed(_uuid, stakingIntentHash, _staker, _beneficiary, _amountST,
    		_amountUT, unlockHeight);

    	return unlockHeight;
    }

    function processMinting(
    	bytes32 _stakingIntentHash)
    	external
    	returns (address tokenAddress)
    {
    	require(_stakingIntentHash != "");

    	Mint storage mint = mints[_stakingIntentHash];
    	require(mint.staker == msg.sender);
    	require(mint.unlockHeight > block.number);

    	UtilityTokenInterface token = registeredTokens[mint.uuid].token;
    	tokenAddress = address(token);
    	require(tokenAddress != address(0));

    	require(token.mint(mint.beneficiary, mint.amount));

		ProcessedMint(mint.uuid, _stakingIntentHash, tokenAddress, mint.staker,
			mint.beneficiary, mint.amount);

		delete mints[_stakingIntentHash];

    	return tokenAddress;
    }

    /// @dev redeemer must set an allowance for the branded token with OpenSTUtility
    ///      as the spender so that the branded token can be taken into escrow by OpenSTUtility
    ///      note: for STPrime, call OpenSTUtility.redeemSTPrime as a payable function
    ///      note: nonce must be queried from OpenSTValue contract
    function redeem(
    	bytes32 _uuid,
    	uint256 _amountBT,
    	uint256 _nonce)
    	external
    	returns (
    	uint256 unlockHeight,
    	bytes32 redemptionIntentHash)
    {
    	require(_uuid != "");
    	require(_amountBT > 0);
    	require(_nonce > nonces[msg.sender]);
    	nonces[msg.sender] = _nonce;

    	// to redeem ST' one needs to send value to payable
    	// function redeemSTPrime
    	require(_uuid != uuidSTPrime);

    	BrandedToken token = BrandedToken(registeredTokens[_uuid].token);

    	require(token.allowance(msg.sender, address(this)) >= _amountBT);
    	require(token.transferFrom(msg.sender, address(this), _amountBT));

    	unlockHeight = block.number + BLOCKS_TO_WAIT_LONG;

    	redemptionIntentHash = hashRedemptionIntent(
    		_uuid,
    		msg.sender,
    		_nonce,
    		_amountBT,
    		unlockHeight
		);

		redemptions[redemptionIntentHash] = Redemption({
			uuid:               _uuid,
			redeemer:           msg.sender,
			amountUT:           _amountBT,
			escrowUnlockHeight: unlockHeight
		});

		RedemptionIntentDeclared(_uuid, redemptionIntentHash, address(token),
			msg.sender, _nonce, _amountBT, unlockHeight, chainIdValue);

		return (unlockHeight, redemptionIntentHash);
    }

    /// @dev redeemer must send as value the amount STP to redeem
    ///      note: nonce must be queried from OpenSTValue contract
    function redeemSTPrime(
    	uint256 _nonce)
    	external
    	payable
    	returns (
  		uint256 amountSTP,
    	uint256 unlockHeight,
    	bytes32 redemptionIntentHash)
    {
    	require(msg.value > 0);
    	require(_nonce > nonces[msg.sender]);
    	nonces[msg.sender] = _nonce;

    	amountSTP = msg.value;
    	unlockHeight = block.number + BLOCKS_TO_WAIT_LONG;

    	redemptionIntentHash = hashRedemptionIntent(
    		uuidSTPrime,
    		msg.sender,
    		_nonce,
    		amountSTP,
    		unlockHeight
		);

		redemptions[redemptionIntentHash] = Redemption({
			uuid:               uuidSTPrime,
			redeemer:           msg.sender,
			amountUT:           amountSTP,
			escrowUnlockHeight: unlockHeight
		});

		RedemptionIntentDeclared(uuidSTPrime, redemptionIntentHash, simpleTokenPrime,
			msg.sender, _nonce, amountSTP, unlockHeight, chainIdValue);

		return (amountSTP, unlockHeight, redemptionIntentHash);
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