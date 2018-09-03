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
import "./MerklePatriciaProof.sol";
import "./ProofLib.sol";
import "./WorkersInterface.sol";
import "./RLP.sol";
import "./SafeMath.sol";

/**
 *  @title Core contract which implements CoreInterface.
 *
 *  @notice Core is a minimal stub that will become the anchoring and consensus point for
 *          the utility chain to validate itself against.
 */
contract Core is CoreInterface {
	using SafeMath for uint256;

	/** Events */

	event StateRootCommitted(uint256 blockHeight, bytes32 stateRoot);

	/** Storage */

	mapping (uint256 /* block height */ => bytes32) private stateRoots;

	/** chainIdOrigin is the origin chain id where core contract is deployed.  */
	uint256 public coreChainIdOrigin;
	/** chainIdRemote is the remote chain id where core contract is deployed. */
	uint256 private coreChainIdRemote;
	/** It is the address of the openSTUtility/openSTValue contract on the remote chain. */
	address private coreOpenSTRemote;
	/** Latest block height of block for which state root was committed. */
	uint256 private latestStateRootBlockHeight;

	/** Workers contract address. */
	WorkersInterface public workers;

	/** Address of the core on the auxiliary chain. Can be zero. */
	address public coCore;

	/** Modifiers */

	/**
	 *  @notice Modifier onlyWorker.
	 *
	 *  @dev Checks if msg.sender is whitelisted worker address to proceed.
	 */
	modifier onlyWorker() {
		// msg.sender should be worker only
		require(workers.isWorker(msg.sender), "Worker address is not whitelisted");
		_;
	}

	/*  Public functions */

	/**
	 *  @notice Contract constructor.
	 *
	 *  @dev bytes32ToBytes is ProofLib contract method.
	 *
	 *  @param _chainIdOrigin Chain id where current core contract is deployed since core contract can be deployed on remote chain also.
	 *  @param _chainIdRemote If current chain is value then _chainIdRemote is chain id of utility chain.
	 *  @param _blockHeight Block height at which _stateRoot needs to store.
	 *  @param _stateRoot State root hash of given _blockHeight.
	 *  @param _workers Workers contract address.
	 */
	constructor(
		uint256 _chainIdOrigin,
		uint256 _chainIdRemote,
		uint256 _blockHeight,
		bytes32 _stateRoot,
		WorkersInterface _workers)
		public
	{
		require(_chainIdOrigin != 0, "Origin chain Id is 0");
		require(_chainIdRemote != 0, "Remote chain Id is 0");
		require(_workers != address(0), "Workers contract address is 0");

		coreChainIdOrigin = _chainIdOrigin;
		coreChainIdRemote = _chainIdRemote;
		workers = _workers;

		latestStateRootBlockHeight = _blockHeight;
		stateRoots[latestStateRootBlockHeight] = _stateRoot;
	}

	/** External functions */

	//TODO: This is added for demo purpose.
	/**
	 *  @notice The Co-Core address is the address of the core that is
	 *          deployed on the auxiliary chain. Should only be set if this
	 *          contract is deployed on the origin chain.
	 *
	 *  @param _coCore Address of the Co-Core on auxiliary.
	 */
	function setCoCoreAddress(address _coCore)
	external
	onlyWorker
	returns (bool /*success*/)
	{
		require(_coCore != address(0), "Co-Core address is 0");
		coCore = _coCore;
		return true;
	}

	/**
	 *  @notice Public view function chainIdRemote.
	 *
	 *  @return uint256 coreChainIdRemote.
	 */
	function chainIdRemote()
	public
	view
	returns (uint256 /* chainIdRemote */)
	{
		return coreChainIdRemote;
	}


	/**
	 *  @notice Public view function getStateRoot.
	 *
	 *  @param _blockHeight Block height for which state root is needed.
	 *
	 *  @return bytes32 State root.
	 */
	function getStateRoot(
		uint256 _blockHeight
	)
	public
	view
	returns (bytes32 /* state root */)
	{
		return stateRoots[_blockHeight];
	}


	/**
	 *  @notice Public function getLatestStateRootBlockHeight.
	 *
	 *  @return uint256 Latest state root block height.
	 */
	function getLatestStateRootBlockHeight()
	public
	view
	returns (uint256 /* block height */)
	{
		return latestStateRootBlockHeight;
	}

	/** External functions */

	/**
	 *  @notice External function commitStateRoot.
	 *
	 *  @dev commitStateRoot Called from game process.
	 *       Commit new state root for a block height.
	 *
	 *  @param _blockHeight Block height for which stateRoots mapping needs to update.
	 *  @param _stateRoot State root of input block height.
	 *
	 *  @return bytes32 stateRoot
	 */
	function commitStateRoot(
		uint256 _blockHeight,
		bytes32 _stateRoot)
	external
	onlyWorker
	returns (bytes32 /* stateRoot */)
	{
		// State root should be valid
		require(_stateRoot != bytes32(0), "State root is 0");
		// Input block height should be valid
		require(_blockHeight > latestStateRootBlockHeight, "Given block height is lower or equal to highest committed state root block height.");

		stateRoots[_blockHeight] = _stateRoot;
		latestStateRootBlockHeight = _blockHeight;

		emit StateRootCommitted(_blockHeight, _stateRoot);

		return _stateRoot;
	}
}