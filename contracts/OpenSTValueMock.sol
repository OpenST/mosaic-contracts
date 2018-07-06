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
import "./TestUtils.sol";

/**
 *	@title OpenSTValueMock which implements the OpenSTValue contract
 *
 *	@notice Overrides certain durational constants, getters
 *			and creates temp variables to ease testing OpenSTValue
 */

contract OpenSTValueMock is OpenSTValue {
	using TestUtils for bytes32;

	uint256 private constant BLOCKS_TO_WAIT_LONG = 8;
	uint256 private constant BLOCKS_TO_WAIT_SHORT = 5;
	// test staker nonce required for confirming the intents mapping index position
	uint256 private constant testStakerNonce = 1;
	// test staker address required for confirming the intents mapping index position
	address private constant testStakerAddress = 0x87FCA9F4CC0D439163235c2C33abe8e4bA203580;
	// test staking intent hash required for confirming the intents mapping index position
	bytes32 private constant testStakingIntentHash = 0xf61ea4fb6316d5ecdd2299b49ef9f07c49077c8a7d105fecc100e453742e0727;
	
	// the following public state variables do not alter the index position of intents mapping
	// as storage in a contract if filled with inherited contract's variables first, ordered left to right 
	// test intents key calculated to store the test staking intent hash in intents mapping
	bytes32 public testIntentsKey = hashIntentKey(testStakerAddress, testStakerNonce);
	// storage path to the test staking intent hash in the intents mapping
	// calculated from the intentsMappingStorageIndexPosition constant in OpenSTValue
	bytes32 public testStoragePath = TestUtils.getStoragePath(testIntentsKey,intentsMappingStorageIndexPosition);
		
	/* Public functions */

	constructor(
		uint256 _chainIdValue,
		EIP20Interface _eip20token,
		address _registrar)
		OpenSTValue(_chainIdValue, _eip20token, _registrar)
		public 
	{
		//inserting the intents mapping with the test staking intent hash against calculated testIntentsKey
		intents[testIntentsKey] = testStakingIntentHash;
	}

	function blocksToWaitLong() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_LONG;
	}

	function blocksToWaitShort() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_SHORT;
	}
}