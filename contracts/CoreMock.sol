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

import "./Core.sol";

/**
 *	@title CoreMock contract
 *
 *	@notice Used for test only
 */
contract CoreMock is Core {

	uint256 private constant TIME_TO_WAIT = 120;

	/*  Public functions */

	/**
	  * @notice Contract constructor
	  *
	  * @param _registrar address of the registrar which registers for utility tokens
	  * @param _chainIdOrigin chain id where current core contract is deployed since core contract can be deployed on remote chain also
	  * @param _chainIdRemote if current chain is value then _chainIdRemote is chain id of utility chain
	  * @param _openSTRemote if current chain is value then _openSTRemote is address of openSTUtility contract address
	  * @param _blockTimeRemote block generation time of remote chain
	  * @param _blockHeight block height at which _stateRoot needs to store
	  * @param _stateRoot state root hash of given _blockHeight
	  * @param _workers Workers contract address
	  */
	constructor(
	address _registrar,
	uint256 _chainIdOrigin,
	uint256 _chainIdRemote,
	address _openSTRemote,
	uint256 _blockTimeRemote,
	uint256 _blockHeight,
	bytes32 _stateRoot,
	WorkersInterface _workers)
	Core(_registrar, _chainIdOrigin, _chainIdRemote, _openSTRemote, _blockTimeRemote, _blockHeight, _stateRoot, _workers) public {
		blocksToWait = TIME_TO_WAIT.div(_blockTimeRemote);
	}

	/**
	  *	@notice Get safe unlock height
	  *
	  *	@return uint256 safeUnlockHeight
	  */
	function safeUnlockHeight()
		external
		view
		returns (uint256 /* safeUnlockHeight */)
	{
		return  block.number + blocksToWait;
	}

	/**
	  *	@notice public view function getStorageRoot
	  *
	  * @dev this is for testing only
	  *
	  *	@param _blockHeight block height for which storage root is needed
	  *
	  *	@return bytes32 storage root
	  */
	function getStorageRoot(
		uint256 _blockHeight)
		public
		view
		returns (bytes32 /* storage root */)
	{
		return keccak256(abi.encodePacked(_blockHeight));
	}
}