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
	  * @param _registrar registrar address
	  * @param _chainIdOrigin origin chain id
	  * @param _chainIdRemote remote chain id
	  * @param _openSTRemote remote openSTUtility/openSTValue contract address
	  */
	constructor(
		address _registrar,
		uint256 _chainIdOrigin,
		uint256 _chainIdRemote,
		address _openSTRemote,
		uint256 _blockTimeRemote,
		WorkersInterface _workers)
		Core(_registrar, _chainIdOrigin, _chainIdRemote, _openSTRemote, _blockTimeRemote, _workers)
		public
	{
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
		return keccak256(_blockHeight);
	}
}