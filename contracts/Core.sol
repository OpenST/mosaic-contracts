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
*	@dev Core is a minimal stub that will become the anchoring and consensus point for
*      the utility chain to validate itself against
*/
contract Core is CoreInterface, Util {

	/**
	*    Events
	*/

	/** event StateRootCommitted on successful execution of commitStateRoot */
	event StateRootCommitted(uint256 blockHeight, bytes32 stateRoot);

	/** event OpenSTProven on successful execution of proveOpenST */
	event OpenSTProven(uint256 blockHeight, bytes32 storageRoot, bytes32 hashedAccount);

	/**
	 *  Storage
	 */

	/** Mapping of block height to state root of the block.  */
	mapping (uint256 /* block height */ => bytes32) public stateRoots;

	/** Mapping of block height to storafe root of the block.  */
	mapping (uint256 /* block height */ => bytes32) public storageRoots;

	/** chainIdOrigin stores the chainId this chain */
	uint256 public coreChainIdOrigin;

	/** chainIdRemote stores the chainId of the remote chain */
	uint256 private coreChainIdRemote;

	/** OpenST remote is the address of the OpenST contract on the remote chain */
	address private coreOpenSTRemote;

	/** registrar registers for the two chains */
	address private coreRegistrar;

	/** Latest block height of block which state root was committed. */
	uint256 public latestStateRootBlockHeight;

	/** Workers contract address */
	WorkersInterface public workers;

	/**
	*  OpenSTRemote encode address. sha3 => bytes32 to bytes
	*  Kept in end because it's dynamic in size
	*/
	bytes public encodedOpenSTRemotePath;

	/**
	*  Modifiers
	*/

	/** only worker modifier */
	modifier onlyWorker() {
		// msg.sender should be worker only
		require(workers.isWorker(msg.sender), "Invalid worker address");
		_;
	}

	/**
	 *  Public functions
	 */

	/**
	* @dev Contract constructor
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
		require(_registrar != address(0), "Registrar should be valid address");
		require(_chainIdOrigin != 0, "Invalid origin chain ID");
		require(_chainIdRemote != 0, "Invalid remote chain ID");
		require(_openSTRemote != address(0), "Invalid openSTRemote contract address");
		require(_workers != address(0), "Workers should be valid contract address");
		coreRegistrar = _registrar;
		coreChainIdOrigin = _chainIdOrigin;
		coreChainIdRemote = _chainIdRemote;
		coreOpenSTRemote = _openSTRemote;
		workers = _workers;
		// Encoded remote path.
		encodedOpenSTRemotePath = bytes32ToBytes(keccak256(coreOpenSTRemote));
	}

	/**
	*	@dev public function registrar
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
	*	@dev public function chainIdRemote
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
	*	@dev public function openSTRemote
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
	*	@dev Commit new state root for a block height
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
		require(_stateRoot != bytes32(0), "Invalid state root");
		// Input block height should be valid
		require(_blockHeight > latestStateRootBlockHeight, "Given block height is lower or equal to highest committed state root block height.");

		stateRoots[_blockHeight] = _stateRoot;
		latestStateRootBlockHeight = _blockHeight;

		emit StateRootCommitted(_blockHeight, _stateRoot);

		return stateRoot;
	}

	/**
	*	@dev Verify account proof of OpenSTRemote and commit storage root at given block height
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
		require(_blockHeight != 0, "Invalid block height");
		// Storage root should be valid
		require(_rlpEncodedAccount.length != 0, "Check length of RLP encoded account is not zero");

		bytes32 stateRoot = stateRoots[_blockHeight];
		// State root should be present for the block height
		require(stateRoot != bytes32(0), "State root missing for given block height");

		// Decode RLP encoded account value
		RLP.RLPItem memory accountItem = RLP.toRLPItem(_rlpEncodedAccount);
		// Convert to list
		RLP.RLPItem[] memory accountArray = RLP.toList(accountItem);
		// Array 3rd position is storage root
		bytes32 storageRoot = RLP.toBytes32(accountArray[2]);
		// Hash the rlpEncodedValue value
		bytes32 hashedAccount = keccak256(_rlpEncodedAccount);

		// Verify the remote OpenST contract against the committed state root with the state trie Merkle proof
		require(MerklePatriciaProof.verify(hashedAccount, encodedOpenSTRemotePath, _rlpParentNodes, stateRoot), "Account proof not verified.");

		// After verification update storageRoots mapping
		storageRoots[_blockHeight] = storageRoot;
		// Emit event
		emit OpenSTProven(_blockHeight, storageRoot, hashedAccount);

		return true;
	}

}