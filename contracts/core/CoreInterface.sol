pragma solidity ^0.4.23;

// Copyright 2018 OpenST Ltd.
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
// Common: core/CoreInterface.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title CoreInterface contract.
 *
 *  @notice Provides interface for core contract.
 */
contract CoreInterface {

	/** Public functions */

	function registrar() public view returns (address /** registrar */);
	function chainIdRemote() public view returns (uint256 /** chainIdRemote */);
	function openSTRemote() public view returns (address /** OpenSTRemote */);
	/** get highest state root block height for which state root is committed. */
	function getLatestStateRootBlockHeight() public view returns (uint256 /** latest state root block height */);
	function getStateRoot(uint256 _blockHeight) public view returns (bytes32 /** state root */);
	function getStorageRoot(uint256 _blockHeight) public view returns (bytes32 /** storage root */);

	/** External functions */

	/** commitStateRoot external function to be called by game process */
	function commitStateRoot(uint256 _blockHeight, bytes32 _stateRoot) external returns (bytes32 /** stateRoot */);
	/** It's called whenever account proof needs to be verified */
	function proveOpenST(uint256 _blockHeight, bytes _rlpEncodedAccount, bytes _rlpParentNodes) external returns (bool /** success */);

	function safeUnlockHeight() external view returns (uint256 /* safeUnlockHeight */);

}