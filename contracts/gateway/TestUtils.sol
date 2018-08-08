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
 *  @title TestUtils contract.
 *
 *  @notice Contains functions used for testing on Mock contracts. 
 */
library TestUtils {

	/** Internal functions */

	/**
	 *  @notice Internal pure function getStoragePath.
	 *
	 *  @param _mappingKey Key of the mapping value.
	 *  @param _indexPosition Index position of the mapping in contract storage.
	 *
	 *  @return bytes32 Path to the mapping value in contract storage.
	 */
	function getStoragePath(
		bytes32 _mappingKey,
		uint256 _indexPosition)
		internal
		pure
		returns (bytes32)
	{
		return keccak256(abi.encode(
			_mappingKey,
			_indexPosition));
	}
}
