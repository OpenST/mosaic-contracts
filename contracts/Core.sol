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
// Common: Core
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./CoreInterface.sol";


/// @dev Core is a minimal stub that will become the anchoring and consensus point for
///      the utility chain to validate itself against
contract Core is CoreInterface {

	/*
	 *  Structures
	 */
	// struct stakeTokenTuple {
	// 	address stake;
	// 	address token;
	// }


	/*
	 *  Storage
	 */
	/// registrar registers for the two chains
	address private coreRegistrar;
	/// chainIdOrigin stores the chainId this chain
	uint256 private coreChainIdOrigin;
	/// chainIdRemote stores the chainId of the remote chain
	uint256 private coreChainIdRemote;
	/// OpenST remote is the address of the OpenST contract
	/// on the remote chain
	address private coreOpenSTRemote;
	// /// 
	// mapping(bytes32 => address) stakeTokenTuple;


	// ~5Days
	uint256 private constant TIME_TO_WAIT_MEDIUM = 432000;

	uint256 public remoteBlockTime;

	uint256 public blocksToWaitMedium;

	/*
	 *  Public functions
	 */
	constructor(
		address _registrar,
		uint256 _chainIdOrigin,
		uint256 _chainIdRemote,
		address _openSTRemote)
		public
	{
		require(_registrar != address(0));
		require(_chainIdOrigin != 0);
		require(_chainIdRemote != 0);
		require(_openSTRemote != 0);
		coreRegistrar = _registrar;
		coreChainIdOrigin = _chainIdOrigin;
		coreChainIdRemote = _chainIdRemote;
		coreOpenSTRemote = _openSTRemote;
	}

	/*
	 *  Public view functions
	 */
	function registrar()
		public
		view
		returns (address /* registrar */)
	{
		return coreRegistrar;
	}

	function chainIdRemote()
		public
		view
		returns (uint256 /* chainIdRemote */)
	{
		return coreChainIdRemote;
	}

	function openSTRemote()
		public
		view
		returns (address /* OpenSTRemote */)
	{
		return coreOpenSTRemote;
	}

	function safeUnlockTime()
		external
		view
		returns (uint256 unlockTime)
	{
		return blocksToWaitMedium + block.number;
	}
}