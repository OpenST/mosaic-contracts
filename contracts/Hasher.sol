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
// Common: Hasher
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

contract Hasher {

	/*
	 *  Public pure functions
	 */
	function hashUuid(
		string _symbol,
		string _name,
		uint256 _chainIdValue,
		uint256 _chainIdUtility,
		address _openSTUtility,
		uint256 _conversionRate)
		public
		pure
		returns (bytes32)
	{
		return keccak256(
			_symbol,
			_name,
			_chainIdValue,
			_chainIdUtility,
			_openSTUtility,
			_conversionRate);
	}

	function hashStakingIntent(
		bytes32 _uuid,
		address _account,
		uint256 _accountNonce,
		address _beneficiary,
		uint256 _amountST,
		uint256 _amountUT,
		uint256 _escrowUnlockHeight)
		public
		pure
		returns (bytes32)
	{
		return keccak256(
			_uuid,
			_account,
			_accountNonce,
			_beneficiary,
			_amountST,
			_amountUT,
			_escrowUnlockHeight);
	}

	function hashRedemptionIntent(
		bytes32 _uuid,
		address _account,
		uint256 _accountNonce,
		uint256 _amountUT,
		uint256 _escrowUnlockHeight)
		public
		pure
		returns (bytes32)
	{
		return keccak256(
			_uuid,
			_account,
			_accountNonce,
			_amountUT,
			_escrowUnlockHeight);
	}
}