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
// Value chain: OpenSTValueMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./OpenSTValue.sol";

/// @title OpenSTValueMock
/// @dev Overrides certain durational constants and getters to ease testing OpenSTValue
contract OpenSTValueMock is OpenSTValue {
	uint256 private constant TIME_TO_WAIT_LONG = 220;
	uint256 private constant TIME_TO_WAIT_SHORT = 20;

	/*
	 *  Public functions
	 */
	constructor(
		uint256 _chainIdValue,
		EIP20Interface _eip20token,
		address _registrar,
		uint256 _blockTime)
		OpenSTValue(_chainIdValue, _eip20token, _registrar, _blockTime)
		public {

		blocksToWaitShort = TIME_TO_WAIT_SHORT.div(_blockTime);
		blocksToWaitLong = TIME_TO_WAIT_LONG.div(_blockTime);

	}

	// mocked verifyRedemptionIntentHashStorage function for testing only
	function verifyRedemptionIntentHashStorage(
		bytes32 _uuid,
		address _redeemer,
		uint256 _redeemerNonce,
		uint256 _blockHeight,
		bytes32 _redemptionIntentHash,
		bytes _rlpParentNodes)
		internal
		view
		returns (bool)
	{
		bytes memory mockedValidValue = OpenSTUtils.bytes32ToBytes(keccak256(uint8(1)));
		return (keccak256(mockedValidValue) == keccak256(_rlpParentNodes));
	}

	// mock function for testing only to get parent nodes
	function getMockRLPParentNodes(
		bool isValid)
		external
		view
		returns (bytes /* mock RLP encoded parent nodes*/)
	{
		if(isValid) {
			bytes memory mockedValidValue = OpenSTUtils.bytes32ToBytes(keccak256(uint8(1)));
			return mockedValidValue;
		}
		bytes memory mockedInvalidValue = OpenSTUtils.bytes32ToBytes(keccak256(uint8(0)));
		return mockedInvalidValue;
	}

}