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
import "./proof/MerklePatriciaProof.sol";
import "./proof/util.sol";
import "./WorkersInterface.sol";


/// @dev Core is a minimal stub that will become the anchoring and consensus point for
///      the utility chain to validate itself against
// TODO - truffle test cases
contract Core is CoreInterface, Util {

	/*
    *    Events
    */
	event StateRootCommitted(uint256 blockHeight, bytes32 stateRoot);

	event AccountProved(uint256 blockHeight, bytes32 stateRoot, bytes encodedAddress, bytes32 storageRoot);

	/*
	 *  Storage
	 */
	/** Mapping of block height to state root of the block.  */
	mapping (uint /* block height */ => bytes32) private stateRoots;
	/** Mapping of block height to storafe root of the block.  */
	mapping (uint /* block height */ => bytes32) private storageRoots;

	// TODO - Do we need below mapping?
	// mapping(bytes32 => address) stakeTokenTuple;

	/// chainIdOrigin stores the chainId this chain
	uint256 private coreChainIdOrigin;
	/// chainIdRemote stores the chainId of the remote chain
	uint256 private coreChainIdRemote;
	/// OpenST remote is the address of the OpenST contract
	/// on the remote chain
	address private coreOpenSTRemote;
	/// registrar registers for the two chains
	address private coreRegistrar;
    /// Latest block height of block which state root was committed.
    uint256 private latestStateRootBlockHeight;
    /// Latest block height of block which storage root was committed.
    uint256 private latestStorageRootBlockHeight;
	/// Workers contract address
	WorkersInterface public workers;

	// TODO - do we need below structures
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
		address _openSTRemote,
		WorkersInterface _workers)
		public
	{
		require(_registrar != address(0), "Registrar should be valid address");
		require(_chainIdOrigin != 0, "Invalid origin chain ID");
		require(_chainIdRemote != 0, "Invalid remote chain ID");
		require(_openSTRemote != 0, "Invalid openSTRemote contract address");
		require(_workers != address(0), "Workers should be valid contract address");
		coreRegistrar = _registrar;
		coreChainIdOrigin = _chainIdOrigin;
		coreChainIdRemote = _chainIdRemote;
		// TODO - openSTRemote is openSTValue and openSTUtility contract address?
		coreOpenSTRemote = _openSTRemote;
		workers = _workers;

        // Initialize
		latestStateRootBlockHeight = 0;
		latestStorageRootBlockHeight = 0;
		// TODO - Do we need to initialize stateRoots and storageRoots mapping?
	}

	/*
	 *  Public view functions
	 */

	/// @dev public function registrar
	/// @return address coreRegistrar
	function registrar()
		public
		view
		returns (address /* registrar */)
	{
		return coreRegistrar;
	}

	/// @dev public function chainIdRemote
	/// @return uint256 coreChainIdRemote
	function chainIdRemote()
		public
		view
		returns (uint256 /* chainIdRemote */)
	{
		return coreChainIdRemote;
	}

	/// @dev public function openSTRemote
	/// @return address coreOpenSTRemote
	function openSTRemote()
		public
		view
		returns (address /* OpenSTRemote */)
	{
		return coreOpenSTRemote;
	}

	/// @dev public function getLatestStateRootBlockHeight
	/// @return uint256 latestStateRootBlockHeight
	function getLatestStateRootBlockHeight()
		public
		view
		returns (uint256 /* latest state root block height */)
	{
		return latestStateRootBlockHeight;
	}

	/// @dev public function getLatestStorageRootBlockHeight
	/// @return uint256 latestStorageRootBlockHeight
	function getLatestStorageRootBlockHeight()
		public
		view
		returns (uint256 /* latest storage root block height */)
	{
		return latestStorageRootBlockHeight;
	}

	/**
     * Commit new state root for a block height
     *
     */
	/// @dev Commit new state root for a block height
	/// @param _blockHeight block Number for which stateRoots mapping needs to update
	/// @param _stateRoot state root of input block height
	/// @return bytes32 stateRoot
	function commitStateRoot(
		uint256 _blockHeight,
		bytes32 _stateRoot)
		external
		returns(bytes32 stateRoot)
	{
		// check if the caller is whitelisted worker
		require(workers.isWorker(msg.sender), "Invalid worker address");
		// State root should be valid
		require(_stateRoot != bytes32(0), "Invalid state root");
		// Input block height should be valid
		require(_blockHeight > latestStateRootBlockHeight, "Given Block height is lower than latestBlockHeight.");

		stateRoots[_blockHeight] = _stateRoot;
		latestStateRootBlockHeight = _blockHeight;

		emit StateRootCommitted(_blockHeight, _stateRoot);

		return stateRoot;
	}

	/// @dev Verify account proof and update storageRoots mapping
	/// @param _blockHeight block Number at which stake happened
	/// @param _value rlpencoded => hashed account node object
	/// @param _rlpParentNodes RLP encoded value of account proof parent nodes
	/// @param _storageRoot storage root received from account proof
    /// @return bool status
	function proveOpenST(
		uint256 _blockHeight,
		bytes32 _value,
		bytes _rlpParentNodes,
		bytes32 _storageRoot)
		external
		returns(bool status)
	{
		// check if the caller is whitelisted worker
		require(workers.isWorker(msg.sender), "Invalid worker address");
		// Check for block height
		require(_blockHeight != 0, "Invalid block height");
		// Storage root should be valid
		require(_storageRoot != bytes32(0), "Invalid storage root");

		bytes32 stateRoot = stateRoots[_blockHeight];
		// State root should be present for the block height
		require(stateRoot != bytes32(0), "State root missing for given block height");

		require(_value != bytes32(0), "Node values are missing");

		// Encode remote address. Storage added because it was generating warning.
		bytes memory encodedAddress = bytes32ToBytes(keccak256(coreOpenSTRemote));

		// Verify proof using library contract
		require(MerklePatriciaProof.verify(_value, encodedAddress, _rlpParentNodes, stateRoot), "Account proof not verified.");

		// After verification update storageRoots mapping
		storageRoots[_blockHeight] = _storageRoot;
		// Update latestStorageRootBlockHeight variable
		latestStorageRootBlockHeight = _blockHeight;
		// Emit event
		emit AccountProved(_blockHeight, stateRoot, encodedAddress, _storageRoot);

		return true;
	}

	/// @dev public function returns stateRoot for a blockHeight
	/// @param _blockHeight block number
	/// @return bytes32
	function getStateRoot(
		uint256 _blockHeight)
		public
		view
		returns (bytes32 /* state root */)
	{
		return stateRoots[_blockHeight];
	}

	/// @dev public function returns storageRoot for a blockHeight
	/// @param _blockHeight block number
	/// @return bytes32
	function getStorageRoot(
		uint256 _blockHeight)
		public
		view
		returns (bytes32 /* storage root */)
	{
		return storageRoots[_blockHeight];
	}

}