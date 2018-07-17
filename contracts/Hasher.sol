pragma solidity ^0.4.23;

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
// Common: Hasher
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title Hasher contract. 
 *
 *  @notice Hasher contains functions for hashing frequently occuring state variables
 *          required for the process of stake and mint / redeem and unstake.
 */
contract Hasher {

	/**  Public functions */

	/**
	 *  @notice Public pure function.
	 *
	 *  @param _symbol Symbol of the token.
	 *  @param _name Name of the token.
	 *  @param _chainIdValue Chain id of the value chain.
	 *  @param _chainIdUtility Chain id of the utility chain.
	 *  @param _openSTUtility Address of the openSTUtility contract.
	 *  @param _conversionRate Conversion rate of the token.
	 *  @param _conversionRateDecimals Decimal places of conversion rate of token.
	 *
	 *  @return bytes32 Keccak256 uuid hash. 
	 */
	function hashUuid(
		string _symbol,
		string _name,
		uint256 _chainIdValue,
		uint256 _chainIdUtility,
		address _openSTUtility,
		uint256 _conversionRate,
		uint8 _conversionRateDecimals)
		public
		pure
		returns (bytes32)
	{
		return keccak256(
			abi.encodePacked(
				_symbol,
				_name,
				_chainIdValue,
				_chainIdUtility,
				_openSTUtility,
				_conversionRate,
				_conversionRateDecimals));
	}

	/**
	 *  @notice Public pure function.
	 *
	 *  @param _uuid UUID of the token.
	 *  @param _account Address of the staking account.
	 *  @param _accountNonce Nonce of the staking account.
	 *  @param _beneficiary Address of the beneficiary on utility chain.
	 *  @param _amountST Amount of ST staked.
	 *  @param _amountUT Amount of UT to mint.
	 *  @param _unlockHeight Block height upto which staking is locked.
	 *  @param _hashLock Hash lock for the stake request. 
	 *
	 *  @return bytes32 Keccak256 staking intent hash.
	 */
	function hashStakingIntent(
		bytes32 _uuid,
		address _account,
		uint256 _accountNonce,
		address _beneficiary,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _unlockHeight,
		bytes32 _hashLock)
		public
		pure
		returns (bytes32)
	{
		return keccak256(
			abi.encodePacked(
				_uuid,
				_account,
				_accountNonce,
				_beneficiary,
				_amountST,
				_amountUT,
				_unlockHeight,
				_hashLock));
	}

	/**
	 *  @notice Public pure function.
	 *
	 *  @param _uuid UUID of the token.
	 *  @param _account Address of the redeeming account.
	 *  @param _accountNonce Nonce of the redeeming account.
	 *  @param _beneficiary Address of the beneficiary on value chain.
	 *  @param _amountUT Amount of UT to redeem.
	 *  @param _unlockHeight Block height up to which redeeming is locked.
	 *  @param _hashLock Hash lock for the redemption request. 
	 *
	 *  @return bytes32 Keccak256 redemption intent hash.
	 */
	function hashRedemptionIntent(
		bytes32 _uuid,
		address _account,
		uint256 _accountNonce,
		address _beneficiary,
		uint256 _amountUT,
		uint256 _unlockHeight,
		bytes32 _hashLock)
		public
		pure
		returns (bytes32)
	{
		return keccak256(
			abi.encodePacked(
				_uuid,
				_account,
				_accountNonce,
				_beneficiary,
				_amountUT,
				_unlockHeight,
				_hashLock));
	}

	/**
	 *  @notice Public pure function.
	 *
	 *  @param _account Address of the hashing account.
	 *  @param _nonce Nonce of the hashing account.
	 *
	 *  @return bytes32 Keccak256 intent key hash.
	 */
	function hashIntentKey(
		address _account,
		uint256 _nonce)
		public
		pure
		returns (bytes32)
	{
		return keccak256(
			abi.encodePacked(
				_account,
				_nonce));
	}
}