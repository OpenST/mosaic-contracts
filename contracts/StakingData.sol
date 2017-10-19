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
// Staking Data
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./EIP20Interface.sol";

/**
   @title StakingData
   @notice Data structures for a Staking contract
*/
contract StakingData {
	EIP20Interface public eip20Token;

	// ~2 weeks, assuming ~15s per block
	uint256 public constant BLOCKS_TO_WAIT = 80667;

	// [uuid == H(utility token name, chainId)]
	mapping(bytes32 => UtilityToken) public utilityTokens;

	// [staker address]
	mapping(address => uint) nonces;

	struct UtilityToken {
		string 	symbol;
		string 	name;
		uint8 	decimals;
		uint 	conversionRate;
		bytes32 chainId;
		uint256 stakedST;
		address stakingAccount;
		// [stakingHash]
		mapping(bytes32 => Stake)	stakes;
		// [unstakingHash]
		mapping(bytes32 => Unstake) unstakes;
	}

	struct Stake {
		address staker;
		uint256 amountST;
		uint256 amountUT;
		uint256 escrowUnlockHeight;
		// TODO: determine unstaking logic w/r/t granters/grantees
		address granter;
	}

	struct Unstake {
		// TODO: determine unstaking logic w/r/t granters/grantees
		address unstaker;
		uint256 amount;
	}
}
