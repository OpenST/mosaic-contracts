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
// Common: Registrar
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./OpsManaged.sol";
// import "./CoreInterface.sol";
import "./OpenSTValueInterface.sol";
import "./OpenSTUtilityInterface.sol";

/// @title Registrar - registers for utility tokens
contract Registrar is OpsManaged {

    /*
     *  Storage
     */
    // mapping(uint256 /* chainId */ => CoreInterface) cores;

    /*
     *  Public functions
     */
    function Registrar() public
        OpsManaged()
    {
    }

    /*
     *  OpenSTValue
     */
    function confirmRedemptionIntent(
    	// address of OpenSTValue registry:
    	OpenSTValueInterface _registry,
    	// OpenSTValue function:
    	bytes32 _uuid,
    	address _redeemer,
    	uint256 _redeemerNonce,
    	uint256 _amountUT,
    	uint256 _redemptionUnlockHeight,
    	bytes32 _redemptionIntentHash)
    	external
    	onlyOps
    	returns (
    	uint256 amountST,
    	uint256 expirationHeight)
    {
    	(amountST, expirationHeight) = _registry.confirmRedemptionIntent(
    		_uuid,
	    	_redeemer,
	    	_redeemerNonce,
	    	_amountUT,
	    	_redemptionUnlockHeight,
	    	_redemptionIntentHash);

    	return (amountST, expirationHeight);
    }

    function addCore(
    	// address of OpenSTValue registry:
    	OpenSTValueInterface _registry,
    	// OpenSTValue function:
   		CoreInterface _core)
		public
		onlyAdminOrOps
		returns (
		bool /* success */)
	{
		return _registry.addCore(_core);
	}

	function registerUtilityToken(
    	// address of OpenSTValue registry:
    	OpenSTValueInterface _registry,
    	// OpenSTValue function:
   		string _symbol,
		string _name,
		uint256 _conversionRate,
		uint256 _chainIdUtility,
		address _stakingAccount,
		bytes32 _checkUuid)
		public
		onlyAdminOrOps
		returns ( 
		bytes32 /* uuid */)
	{
		return _registry.registerUtilityToken(
			_symbol,
			_name,
			_conversionRate,
			_chainIdUtility,
			_stakingAccount,
			_checkUuid);
	}

	function processStaking(
		// address of OpenSTValue registry:
		OpenSTValueInterface _registry,
    	// OpenSTValue function:
		bytes32 _stakingIntentHash)
		external
		onlyAdmin
		returns (
		address stakeAddress)
	{
		return _registry.processStaking(
			_stakingIntentHash);
	}

	/*
	 *  OpenSTUtility
	 */
	function confirmStakingIntent(
    	// address of OpenSTUtility registry:
    	OpenSTUtilityInterface _registry,
    	// OpenSTUtility function:
		bytes32 _uuid,
		address _staker,
		uint256 _stakerNonce,
		address _beneficiary,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _stakingUnlockHeight,
		bytes32 _stakingIntentHash)
		external
		onlyOps
		returns (
		uint256 /* expirationHeight */)
	{
		return _registry.confirmStakingIntent(
			_uuid,
			_staker,
			_stakerNonce,
			_beneficiary,
			_amountST,
			_amountUT,
			_stakingUnlockHeight,
			_stakingIntentHash);
	}

	function registerBrandedToken(
    	// address of OpenSTUtility registry:
    	OpenSTUtilityInterface _registry,
    	// OpenSTUtility function:
		string _symbol,
		string _name,
		uint256 _conversionRate,
		address _requester,
		UtilityTokenInterface _brandedToken,
		bytes32 _checkUuid)
		public
		onlyAdminOrOps
		returns (
		bytes32 /* registeredUuid */)
	{
		return _registry.registerBrandedToken(
			_symbol,
			_name,
			_conversionRate,
			_requester,
			_brandedToken,
			_checkUuid);
	}

    function processRedeeming(
    	// address of OpenSTUtility registry:
    	OpenSTUtilityInterface _registry,
    	// OpenSTUtility function:
    	bytes32 _redemptionIntentHash)
    	external
    	onlyAdmin
    	returns (
    	address tokenAddress)
    {
    	return _registry.processRedeeming(
    		_redemptionIntentHash);
    }
}