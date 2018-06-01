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
    *    Events
    */
	event CommittedStateRoot(uint256 blockHeight, bytes32 stateRoot);

	event CommittedStorageRoot(uint256 blockHeight, bytes32 storageRoot);

	/** Mapping of block height to state root of the block.  */
	mapping (uint /* block height */ => bytes32) public stateRoots;
	/** Mapping of block height to storafe root of the block.  */
	mapping (uint /* block height */ => bytes32) public storageRoots;

	// mapping(bytes32 => address) stakeTokenTuple;

	/*
	 *  Storage
	 */
	/// chainIdOrigin stores the chainId this chain
	uint256 private coreChainIdOrigin;
	/// chainIdRemote stores the chainId of the remote chain
	uint256 private coreChainIdRemote;
	/// Latest block height of block which state root was committed.
	uint256 public latestStateRootBlockHeight;
	/// Latest block height of block which storage root was committed.
	uint256 public latestStorageRootBlockHeight;
	/// OpenST remote is the address of the OpenST contract
	/// on the remote chain
	address private coreOpenSTRemote;
	/// registrar registers for the two chains
	address private coreRegistrar;

	/*
	 *  Structures
	 */
	// struct stakeTokenTuple {
	// 	address stake;
	// 	address token;
	// }

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

        // Initialize
		latestStateRootBlockHeight = 0;
		latestStorageRootBlockHeight = 0;
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

	/**
     * Commit new state root for a block height
     *
     */
	function commitStateRoot(
		uint256 _blockHeight,
		bytes32 _stateRoot)
		external
		returns(bytes32 stateRoot)
	{
		require(_blockHeight > latestStateRootBlockHeight, "Given Block height is lower than latestBlockHeight.");
		stateRoots[_blockHeight] = _stateRoot;
		latestStateRootBlockHeight = _blockHeight;

		emit CommittedStateRoot(_blockHeight, _stateRoot);

		return stateRoot;
	}

	/**
     * Commit new storage root for a block height
     *
     */
	function commitStorageRoot(
		uint256 _blockHeight,
		bytes32 _storageRoot)
		external
		returns(bytes32 storageRoot)
	{
		require(_blockHeight > latestStorageRootBlockHeight, "Given Block height is lower than latestBlockHeight.");
		storageRoots[_blockHeight] = _storageRoot;
		latestStorageRootBlockHeight = _blockHeight;

		emit CommittedStorageRoot(_blockHeight, _storageRoot);

		return _storageRoot;
	}
}