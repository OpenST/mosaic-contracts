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
import "./util.sol";
import "./WorkersInterface.sol";
import "./RLP.sol";

/**
 *	@title Core contract which implements CoreInterface
 *
 *	@notice Core is a minimal stub that will become the anchoring and consensus point for
 *      the utility chain to validate itself against
 */
contract Core is CoreInterface, Util {

	/* Events */

	event StateRootCommitted(uint256 blockHeight, bytes32 stateRoot);

	/** wasAlreadyProved parameter differentiates between first call and replay call of proveOpenST method for same block height */
	event OpenSTProven(uint256 blockHeight, bytes32 storageRoot, bool wasAlreadyProved);

	/*  Storage */

	mapping (uint256 /* block height */ => bytes32) private stateRoots;

	mapping (uint256 /* block height */ => bytes32) private storageRoots;

	/** chainIdOrigin is the origin chain id where core contract is deployed  */
	uint256 public coreChainIdOrigin;

	/** chainIdRemote is the remote chain id where core contract is deployed */
	uint256 private coreChainIdRemote;

	/** It is the address of the openSTUtility/openSTValue contract on the remote chain */
	address private coreOpenSTRemote;

	address private coreRegistrar;

	/** Latest block height of block for which state root was committed. */
	uint256 private latestStateRootBlockHeight;

	/** Workers contract address */
	WorkersInterface public workers;

	/**
	 *  OpenSTRemote encoded path. Constructed with below flow:
	 *  coreOpenSTRemote => sha3 => bytes32 => bytes
	 */
	bytes private encodedOpenSTRemotePath;

	/* Modifiers */

	/** only worker modifier */
	modifier onlyWorker() {
		// msg.sender should be worker only
		require(workers.isWorker(msg.sender), "Worker address is not whitelisted");
		_;
	}

	/*  Public functions */

	/**
	 * @notice Contract constructor
	 *
	 * @dev bytes32ToBytes is util contract method
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
		WorkersInterface _workers)
		public
	{
		require(_registrar != address(0), "Registrar address is 0");
		require(_chainIdOrigin != 0, "Origin chain Id is 0");
		require(_chainIdRemote != 0, "Remote chain Id is 0");
		require(_openSTRemote != address(0), "OpenSTRemote address is 0");
		require(_workers != address(0), "Workers contract address is 0");
		coreRegistrar = _registrar;
		coreChainIdOrigin = _chainIdOrigin;
		coreChainIdRemote = _chainIdRemote;
		coreOpenSTRemote = _openSTRemote;
		workers = _workers;
		// Encoded remote path.
		encodedOpenSTRemotePath = bytes32ToBytes(keccak256(coreOpenSTRemote));
	}

	/**
	 *	@notice public view function registrar
	 *
	 *	@return address coreRegistrar
	 */
	function registrar()
		public
		view
		returns (address /* registrar */)
	{
		return coreRegistrar;
	}

	/**
	 *	@notice public view function chainIdRemote
	 *
	 *	@return uint256 coreChainIdRemote
	 */
	function chainIdRemote()
		public
		view
		returns (uint256 /* chainIdRemote */)
	{
		return coreChainIdRemote;
	}

	/**
	 *	@notice public view function openSTRemote
	 *
	 *	@return address coreOpenSTRemote
	 */
	function openSTRemote()
		public
		view
		returns (address /* OpenSTRemote */)
	{
		return coreOpenSTRemote;
	}

	/**
	 *	@notice Commit new state root for a block height
	 *
	 *  @dev commitStateRoot called from game process
	 *
	 *	@param _blockHeight block height for which stateRoots mapping needs to update
	 *	@param _stateRoot state root of input block height
	 *
	 *	@return bytes32 stateRoot
	 */
	function commitStateRoot(
		uint256 _blockHeight,
		bytes32 _stateRoot)
		external
		onlyWorker
		returns(bytes32 /* stateRoot */)
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

	/**
	 *	@notice Verify account proof of OpenSTRemote and commit storage root at given block height
	 *
	 *  @dev ProofVerificationSkipped event needed to identify replay calls for same block height
	 *
	 *	@param _blockHeight block height at which OpenST is to be proven
	 *	@param _rlpEncodedAccount rlpencoded account node object
	 *	@param _rlpParentNodes RLP encoded value of account proof parent nodes
	 *
	 *	@return bool status
	 */
	function proveOpenST(
		uint256 _blockHeight,
		bytes _rlpEncodedAccount,
		bytes _rlpParentNodes)
		external
		returns(bool /* success */)
	{
		// Check for block height
		require(_blockHeight != 0, "Given block height is 0");
		// _rlpEncodedAccount should be valid
		require(_rlpEncodedAccount.length != 0, "Length of RLP encoded account is 0");
		// _rlpParentNodes should be valid
		require(_rlpParentNodes.length != 0, "Length of RLP parent nodes is 0");

		bytes32 stateRoot = stateRoots[_blockHeight];
		// State root should be present for the block height
		require(stateRoot != bytes32(0), "State root is 0");

		// Decode RLP encoded account value
		RLP.RLPItem memory accountItem = RLP.toRLPItem(_rlpEncodedAccount);
		// Convert to list
		RLP.RLPItem[] memory accountArray = RLP.toList(accountItem);
		// Array 3rd position is storage root
		bytes32 storageRoot = RLP.toBytes32(accountArray[2]);
		// Hash the rlpEncodedValue value
		bytes32 hashedAccount = keccak256(_rlpEncodedAccount);

		// If account already proven for block height
		bytes32 provenStorageRoot = storageRoots[_blockHeight];
		if (provenStorageRoot != bytes32(0)) {
			// Check extracted storage root is matching with existing stored storage root
			require(provenStorageRoot == storageRoot, "Storage root mismatch when account is already proven");
			// wasAlreadyProved is true here since proveOpenST is replay call for same block height
			emit OpenSTProven(_blockHeight, storageRoot, true);
			// return true
			return true;
		}

		// Verify the remote OpenST contract against the committed state root with the state trie Merkle proof
		require(MerklePatriciaProof.verify(hashedAccount, encodedOpenSTRemotePath, _rlpParentNodes, stateRoot), "Account proof is not verified.");

		// After verification update storageRoots mapping
		storageRoots[_blockHeight] = storageRoot;
		// wasAlreadyProved is false since proveOpenST is called for the first time for a block height
		emit OpenSTProven(_blockHeight, storageRoot, false);

		return true;
	}

	/**
	 *	@notice public view function getStateRoot
	 *
	 *	@param _blockHeight block height for which state root is needed
	 *
	 *	@return bytes32 state root
	 */
	function getStateRoot(
		uint256 _blockHeight)
		public
		view
		returns (bytes32 /* state root */)
	{
		return stateRoots[_blockHeight];
	}

	/**
	 *	@notice public view function getStorageRoot
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
		return storageRoots[_blockHeight];
	}

	/**
	 *	@notice public function getLatestStateRootBlockHeight
	 *
	 *	@return uint256 latest state root block height
	 */
	function getLatestStateRootBlockHeight()
		public
		view
		returns (uint256 /* block height */)
	{
		return latestStateRootBlockHeight;
	}

}