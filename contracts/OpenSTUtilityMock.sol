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
// Utility chain: OpenSTUtilityMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./OpenSTUtility.sol";

/// @title OpenSTUtilityMock
/// @dev Overrides certain durational constants and getters to ease testing OpenSTUtility
contract OpenSTUtilityMock is OpenSTUtility {
	uint256 private constant BLOCKS_TO_WAIT_LONG = 8;
	uint256 private constant BLOCKS_TO_WAIT_SHORT = 5;

	/*
	 *  Public functions
	 */
	constructor(
		uint256 _chainIdValue,
		uint256 _chainIdUtility,
		address _registrar,
		CoreInterface _core)
		OpenSTUtility(_chainIdValue, _chainIdUtility, _registrar, _core)
		public { }

	function blocksToWaitLong() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_LONG;
	}

	function blocksToWaitShort() public pure returns (uint256) {
		return BLOCKS_TO_WAIT_SHORT;
	}

	// mock function for testing only to verify storage proof
	function merkleVerificationOfStake(
		address _staker,
		uint256 _stakerNonce,
		bytes32 stakingIntentHash,
		bytes rlpParentNodes,
		bytes32 storageRoot)
	    private
	    returns(bool /* MerkleProofStatus*/)
	{
		bytes memory mockedValidValue = OpenSTUtils.bytes32ToBytes(keccak256(uint8(1)));
		return (keccak256(mockedValidValue) == keccak256(rlpParentNodes));
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