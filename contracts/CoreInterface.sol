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
// Common: CoreInterface
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

contract CoreInterface {

	/** registrar public function */
	function registrar() public view returns (address /* registrar */);

	/** chainID remote public function */
	function chainIdRemote() public view returns (uint256 /* chainIdRemote */);

	/** openST remote public function */
	function openSTRemote() public view returns (address /* OpenSTRemote */);

	/** commitStateRoot external function */
	function commitStateRoot(uint256 _blockHeight, bytes32 _stateRoot) external returns (bytes32 /* stateRoot */);

	/** proveOpenST external function */
	function proveOpenST(uint256 _blockHeight, bytes _rlpEncodedAccount, bytes _rlpParentNodes) external returns (bool /* success */);

	/** get latest state root block height public function */
	function getLatestStateRootBlockHeight() public view returns (uint256 /* latest state root block height */);

	/** get state root public function */
	function getStateRoot(uint256 _blockHeight) public view returns (bytes32 /* state root */);

	/** get storage root public function */
	function getStorageRoot(uint256 _blockHeight) public view returns (bytes32 /* storage root */);

}