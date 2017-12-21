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
// Value chain: OpenSTValue
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./SafeMath.sol";
import "./Hasher.sol";
import "./OpsManaged.sol";
import "./EIP20Interface.sol";
import "./CoreInterface.sol";
import "./ProtocolVersioned.sol";

// value chain contracts
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
    event StakingIntentDeclared(bytes32 indexed _uuid, address indexed _staker,
    	uint256 _stakerNonce, address _beneficiary, uint256 _amountST,
    	uint256 _amountUT, uint256 _unlockHeight, bytes32 _stakingIntentHash,
    	uint256 _chainIdUtility);
    event ProcessedStake(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash,
    	address _stake, address _staker, uint256 _amountST, uint256 _amountUT);
    event RevertedStake(bytes32 indexed _uuid, bytes32 indexed _stakingIntentHash,
    	address _staker, uint256 _amountST, uint256 _amountUT);
	event RedemptionIntentConfirmed(bytes32 indexed _uuid, bytes32 _redemptionIntentHash,
		address _redeemer, uint256 _amountST, uint256 _amountUT, uint256 _expirationHeight);
	event ProcessedUnstake(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash,
		address stake, address _redeemer, uint256 _amountST);
    event RevertedUnstake(bytes32 indexed _uuid, bytes32 indexed _redemptionIntentHash,
    	address _redeemer, uint256 _amountST);

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
    	SimpleStake simpleStake;
    	address stakingAccount;
    }

    struct Stake {
    	bytes32 uuid;
    	address staker;
    	address beneficiary;
    	uint256 nonce;
    	uint256 amountST;
    	uint256 amountUT;
    	uint256 unlockHeight;
    }

    struct Unstake {
    	bytes32 uuid;
    	address redeemer;
    	uint256 amountST;
    	// @dev consider removal of amountUT
    	uint256 amountUT;
    	uint256 expirationHeight;
    }

	/*
	 *  Storage
	 */
 	uint256 public chainIdValue;
 	EIP20Interface public valueToken;
 	address public registrar;
	mapping(uint256 /* chainIdUtility */ => CoreInterface) cores;
	mapping(bytes32 /* uuid */ => UtilityToken) utilityTokens;
	/// nonce makes the staking process atomic across the two-phased process
	/// and protects against replay attack on (un)staking proofs during the process.
	/// On the value chain nonces need to strictly increase by one; on the utility
	/// chain the nonce need to strictly increase (as one value chain can have multiple
	/// utility chains)
	mapping(address /* (un)staker */ => uint256) nonces;
	/// register the active stakes and unstakes
	mapping(bytes32 /* hashStakingIntent */ => Stake) stakes;
	mapping(bytes32 /* hashRedemptionIntent */ => Unstake) unstakes;


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
	function stake(
		bytes32 _uuid,
		uint256 _amountST,
		address _beneficiary)
		external
		returns (
		uint256 amountUT,
		uint256 nonce,
		uint256 unlockHeight,
		bytes32 stakingIntentHash)
	{
		// check the staking contract has been approved to spend the amount to stake
		// OpenSTValue needs to be able to transfer the stake into its balance for
		// keeping until the two-phase process is completed on both chains.
		require(_amountST > 0);
		// Consider the security risk of using tx.origin; at the same time an allowance
		// needs to be set before calling stake over a potentially malicious contract at stakingAccount.
		// The second protection is that the staker needs to check the intent hash before
		// signing off on completing the two-phased process.
		require(valueToken.allowance(tx.origin, address(this)) >= _amountST);

		require(utilityTokens[_uuid].simpleStake != address(0));
		require(_beneficiary != address(0));

		UtilityToken storage utilityToken = utilityTokens[_uuid];

		// if the staking account is set to a non-zero address,
		// then all transactions have come (from/over) the staking account,
		// whether this is an EOA or a contract; tx.origin is putting forward the funds
		if (utilityToken.stakingAccount != address(0)) require(msg.sender == utilityToken.stakingAccount);
		require(valueToken.transferFrom(tx.origin, address(this), _amountST));

		amountUT = _amountST.mul(utilityToken.conversionRate);
		unlockHeight = block.number + BLOCKS_TO_WAIT_LONG;

		nonces[tx.origin]++;
		nonce = nonces[tx.origin];

		stakingIntentHash = hashStakingIntent(
			_uuid,
			tx.origin,
			nonce,
			_beneficiary,
			_amountST,
			amountUT,
			unlockHeight
		);

		stakes[stakingIntentHash] = Stake({
			uuid:         _uuid,
			staker:       tx.origin,
			beneficiary:  _beneficiary,
			nonce:        nonce,
			amountST:     _amountST,
			amountUT:     amountUT,
			unlockHeight: unlockHeight
		});
    	
    	StakingIntentDeclared(_uuid, tx.origin, nonce, _beneficiary,
    		_amountST, amountUT, unlockHeight, stakingIntentHash, utilityToken.chainIdUtility);

    	return (amountUT, nonce, unlockHeight, stakingIntentHash);
	}

	function processStaking(
		bytes32 _stakingIntentHash)
		external
		returns (address stakeAddress)
	{
		require(_stakingIntentHash != "");

		Stake storage stake = stakes[_stakingIntentHash];

		// note: as processStaking incurs a cost for the staker, we provide a fallback
		// in v0.9 for registrar to process the staking on behalf of the staker,
		// as the staker could fail to process the stake and avoid the cost of staking;
		// this will be replaced with a signature carry-over implementation instead, where
		// the signature of the intent hash suffices on value and utility chain, decoupling
		// it from the transaction to processStaking and processMinting
		require(stake.staker == msg.sender || registrar == msg.sender);
		// as this bears the cost, there is no need to require
		// that the stake.unlockHeight is not yet surpassed
		// as is required on processMinting

		UtilityToken storage utilityToken = utilityTokens[stake.uuid];
		stakeAddress = address(utilityToken.simpleStake);
		require(stakeAddress != address(0));

		assert(valueToken.balanceOf(address(this)) >= stake.amountST);
		require(valueToken.transfer(stakeAddress, stake.amountST));

    	ProcessedStake(stake.uuid, _stakingIntentHash, stakeAddress, stake.staker,
    		stake.amountST, stake.amountUT);

    	delete stakes[_stakingIntentHash];

    	return stakeAddress;
    }

    function revertStaking(
    	bytes32 _stakingIntentHash)
    	external
    	returns (
    	bytes32 uuid,
    	uint256 amountST,
    	address staker)
    {
    	require(_stakingIntentHash != "");

    	Stake storage stake = stakes[_stakingIntentHash];

    	// require that the stake is unlocked and exists
    	require(stake.unlockHeight > 0);
		require(stake.unlockHeight <= block.number);

    	assert(valueToken.balanceOf(address(this)) >= stake.amountST);
    	// revert the amount that was intended to be staked back to staker
		require(valueToken.transfer(stake.staker, stake.amountST));

		uuid = stake.uuid;
		amountST = stake.amountST;
		staker = stake.staker;

		RevertedStake(stake.uuid, _stakingIntentHash, stake.staker,
    		stake.amountST, stake.amountUT);

		delete stakes[_stakingIntentHash];

		return (uuid, amountST, staker);
    }

    function confirmRedemptionIntent(
    	bytes32 _uuid,
    	address _redeemer,
    	uint256 _redeemerNonce,
    	uint256 _amountUT,
    	uint256 _redemptionUnlockHeight,
    	bytes32 _redemptionIntentHash)
    	external
    	onlyRegistrar
    	returns (
    	uint256 amountST,
    	uint256 expirationHeight)
    {
		require(utilityTokens[_uuid].simpleStake != address(0));
    	require(_amountUT > 0);
    	// later core will provide a view on the block height of the
    	// utility chain
    	require(_redemptionUnlockHeight > 0);
    	require(_redemptionIntentHash != "");

		require(nonces[_redeemer] + 1 == _redeemerNonce);
    	nonces[_redeemer]++;

    	bytes32 redemptionIntentHash = hashRedemptionIntent(
    		_uuid,
    		_redeemer,
    		nonces[_redeemer],
    		_amountUT,
    		_redemptionUnlockHeight
    	);

    	require(_redemptionIntentHash == redemptionIntentHash);

    	expirationHeight = block.number + BLOCKS_TO_WAIT_SHORT;

    	UtilityToken storage utilityToken = utilityTokens[_uuid];
    	// minimal precision to unstake 1 STWei
    	require(_amountUT >= utilityToken.conversionRate);
    	amountST = _amountUT.div(utilityToken.conversionRate);

    	require(valueToken.balanceOf(address(utilityToken.simpleStake)) >= amountST);

    	unstakes[redemptionIntentHash] = Unstake({
    		uuid:         _uuid,
    		redeemer:     _redeemer,
    		amountUT:     _amountUT,
    		amountST:     amountST,
    		expirationHeight: expirationHeight
    	});

		RedemptionIntentConfirmed(_uuid, redemptionIntentHash, _redeemer,
			amountST, _amountUT, expirationHeight);

		return (amountST, expirationHeight);
	}

	function processUnstaking(
		bytes32 _redemptionIntentHash)
		external
		returns (
		address stakeAddress)
	{
		require(_redemptionIntentHash != "");

		Unstake storage unstake = unstakes[_redemptionIntentHash];
		require(unstake.redeemer == msg.sender);

		// as the process unstake results in a gain for the caller
		// it needs to expire well before the process redemption can
		// be reverted in OpenSTUtility
		require(unstake.expirationHeight > block.number);

		UtilityToken storage utilityToken = utilityTokens[unstake.uuid];
		stakeAddress = address(utilityToken.simpleStake);
		require(stakeAddress != address(0));

		require(utilityToken.simpleStake.releaseTo(unstake.redeemer, unstake.amountST));
	
		ProcessedUnstake(unstake.uuid, _redemptionIntentHash, stakeAddress, 
			unstake.redeemer, unstake.amountST);

		delete unstakes[_redemptionIntentHash];

		return stakeAddress;
	}

	function revertUnstaking(
		bytes32 _redemptionIntentHash)
		external
		returns (
		bytes32 uuid,
		address redeemer,
		uint256 amountST)
	{
		require(_redemptionIntentHash != "");
		
		Unstake storage unstake = unstakes[_redemptionIntentHash];

    	// require that the unstake has expired and that the redeemer has not
    	// processed the unstaking, ie unstake has not been deleted
    	require(unstake.expirationHeight > 0);
    	require(unstake.expirationHeight <= block.number);

    	uuid = unstake.uuid;
    	redeemer = unstake.redeemer;
    	amountST = unstake.amountST;

    	delete unstakes[_redemptionIntentHash];

    	RevertedUnstake(uuid, _redemptionIntentHash, redeemer, amountST);

    	return (uuid, redeemer, amountST);
	}

    /*
     *  Public view functions
     */
    function getNextNonce(
    	address _account)
    	public
    	view
    	returns (uint256 /* nextNonce */)
    {
    	return (nonces[_account] + 1);
    }

    function core(
    	uint256 _chainIdUtility)
    	external
    	view
    	returns (address /* core address */ )
    {
    	return address(cores[_chainIdUtility]);
    }

	function utilityTokenProperties(
		bytes32 _uuid)
		external
		view
		returns (
		string  symbol,
		string  name,
		uint256 conversionRate,
		uint8   decimals,
		uint256 chainIdUtility,
		address simpleStake,
		address stakingAccount
		/* utility token struct */ )
	{
		UtilityToken storage utilityToken = utilityTokens[_uuid];
		return (
			utilityToken.symbol,
			utilityToken.name,
			utilityToken.conversionRate,
			utilityToken.decimals,
			utilityToken.chainIdUtility,
			address(utilityToken.simpleStake),
			utilityToken.stakingAccount);
	}

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

		require(address(utilityTokens[uuid].simpleStake) == address(0));

		SimpleStake simpleStake = new SimpleStake(
			valueToken, address(this), uuid);

		utilityTokens[uuid] = UtilityToken({
			symbol:         _symbol,
			name:           _name,
			conversionRate: _conversionRate,
			decimals:       TOKEN_DECIMALS,
			chainIdUtility: _chainIdUtility,
			simpleStake:    simpleStake,
			stakingAccount: _stakingAccount
		});

		UtilityTokenRegistered(uuid, address(simpleStake), _symbol, _name, 
			TOKEN_DECIMALS, _conversionRate, _chainIdUtility, _stakingAccount);

		return uuid;
	}

	/*
	 *  Administrative functions
	 */
	function initiateProtocolTransfer(
		ProtocolVersioned _simpleStake,
		address _proposedProtocol)
		public
		onlyAdmin
		returns (bool)
	{
		_simpleStake.initiateProtocolTransfer(_proposedProtocol);

		return true;
	}

	// on the very first released version v0.9.1 there is no need
	// to completeProtocolTransfer from a previous version

	function revokeProtocolTransfer(
		ProtocolVersioned _simpleStake)
		public
		onlyAdmin
		returns (bool)
	{
		_simpleStake.revokeProtocolTransfer();

		return true;
	}
}