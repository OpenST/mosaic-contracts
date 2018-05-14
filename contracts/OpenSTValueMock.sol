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
// Value chain: OpenSTValueMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./OpenSTValue.sol";

/// @title OpenSTValueMock
/// @dev Overrides certain durational constants and getters to ease testing OpenSTValue
contract OpenSTValueMock is OpenSTValue {
	uint256 private constant BLOCKS_TO_WAIT_LONG = 8;
	uint256 private constant BLOCKS_TO_WAIT_SHORT = 5;

	/*
	 *  Public functions
	 */
	constructor(
		uint256 _chainIdValue,
		EIP20Interface _eip20token,
		address _registrar)
		OpenSTValue(_chainIdValue, _eip20token, _registrar)
		public { }

	function blocksToWaitLong() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_LONG;
	}

	function blocksToWaitShort() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_SHORT;
	}
}