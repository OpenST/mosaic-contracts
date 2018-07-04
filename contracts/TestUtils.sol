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
// Common: TestingUtils
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *	@title TestingUtils 
 *
 *	@notice contains functions used for testing on Mock contracts. 
 */
library TestUtils {

	/**
	 *	@notice mapping storage key hasher
	 *
	 *	@dev mapStorageKey called from the OpenSTValueMock contract for testing
	 *	@param _key key of the mapping value
	 *	@param _position position of the mapping in the index of storage
	 *
	 *	@return bytes32 key to the mapping value in contract storage
	 */

	function mapStorageKey(
		bytes32 _key,
		uint256 _position)
		internal
		pure
		returns (bytes32)
	{
		return keccak256(abi.encode(
			_key,
			_position));
	}
}