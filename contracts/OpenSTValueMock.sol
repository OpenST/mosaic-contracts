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
	uint256 private constant TIME_TO_WAIT_LONG = 120;
	uint256 private constant TIME_TO_WAIT_MEDIUM = 90;
	uint256 private constant TIME_TO_WAIT_SHORT = 75;

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
		blocksToWaitMedium = TIME_TO_WAIT_MEDIUM.div(_blockTime);
		blocksToWaitLong = TIME_TO_WAIT_LONG.div(_blockTime);

	}
}