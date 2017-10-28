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
// Utility Token Data
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
   @title UtilityTokenData
   @notice Data structures for a UtilityToken contract
*/
contract UtilityTokenData {
	bytes32 public uuid;

	// ~2 weeks, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_LONG = 80667;
	// ~1hour, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT_SHORT = 240;

	// [staker address]
	mapping(address => uint) nonces;

	// [stakingHash]
	mapping(bytes32 => Mint) mints;

	// [unstakingHash]
	mapping(bytes32 => Redemption) redemptions;

	struct Mint {
		address minter;
		uint256 amount;
	}

	struct Redemption {
		address redeemer;
		uint256 amountUT;
		uint256 amountST;
		uint256 escrowUnlockHeight;
	}
}
