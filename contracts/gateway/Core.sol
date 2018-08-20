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
	/** wasAlreadyProved parameter differentiates between first call and replay call of proveOpenST method for same block height */
	event OpenSTProven(uint256 blockHeight, bytes32 storageRoot, bool wasAlreadyProved);

	/** Storage */

	mapping (uint256 /* block height */ => bytes32) private stateRoots;
	mapping (uint256 /* block height */ => bytes32) private storageRoots;

	/** chainIdOrigin is the origin chain id where core contract is deployed.  */
	uint256 public coreChainIdOrigin;
	/** chainIdRemote is the remote chain id where core contract is deployed. */
	uint256 private coreChainIdRemote;
	/** It is the address of the openSTUtility/openSTValue contract on the remote chain. */
	address private coreOpenSTRemote;
	address private coreRegistrar;
	/** Latest block height of block for which state root was committed. */
	uint256 private latestStateRootBlockHeight;

	/** Workers contract address. */
	WorkersInterface public workers;

	/**
	 *  OpenSTRemote encoded path. Constructed with below flow:
	 *  coreOpenSTRemote => sha3 => bytes32 => bytes
	 */
	bytes private encodedOpenSTRemotePath;

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

	// time that is safe to execute confirmStakingIntent and confirmRedemptionIntent from the time the
	// stake and redemption was initiated
	// 5Days in seconds
	uint256 private constant TIME_TO_WAIT = 432000;

	uint256 public remoteChainBlockGenerationTime;

	uint256 public remoteChainBlocksToWait;

	/*  Public functions */

	/**
	 *  @notice Contract constructor.
	 *
	 *  @dev bytes32ToBytes is ProofLib contract method.
	 *
	 *  @param _registrar Address of the registrar which registers for utility tokens.
	 *  @param _chainIdOrigin Chain id where current core contract is deployed since core contract can be deployed on remote chain also.
	 *  @param _chainIdRemote If current chain is value then _chainIdRemote is chain id of utility chain.
	 *  @param _openSTRemote If current chain is value then _openSTRemote is address of openSTUtility contract address.
	 *  @param _remoteChainBlockGenerationTime block generation time of remote chain.
	 *  @param _blockHeight Block height at which _stateRoot needs to store.
	 *  @param _stateRoot State root hash of given _blockHeight.
	 *  @param _workers Workers contract address.
	 */
	constructor(
		address _registrar,
		uint256 _chainIdOrigin,
		uint256 _chainIdRemote,
		address _openSTRemote,
		uint256 _remoteChainBlockGenerationTime,
		uint256 _blockHeight,
		bytes32 _stateRoot,
		WorkersInterface _workers)
		public
	{
		require(_registrar != address(0), "Registrar address is 0");
		require(_chainIdOrigin != 0, "Origin chain Id is 0");
		require(_chainIdRemote != 0, "Remote chain Id is 0");
		require(_openSTRemote != address(0), "OpenSTRemote address is 0");
		require(_workers != address(0), "Workers contract address is 0");
		require(_remoteChainBlockGenerationTime != uint256(0), "Remote block time is 0");
		coreRegistrar = _registrar;
		coreChainIdOrigin = _chainIdOrigin;
		coreChainIdRemote = _chainIdRemote;
		coreOpenSTRemote = _openSTRemote;
		workers = _workers;
		remoteChainBlockGenerationTime = _remoteChainBlockGenerationTime;
		remoteChainBlocksToWait = TIME_TO_WAIT.div(_remoteChainBlockGenerationTime);
		// Encoded remote path.
		encodedOpenSTRemotePath = ProofLib.bytes32ToBytes(keccak256(abi.encodePacked(coreOpenSTRemote)));
		latestStateRootBlockHeight = _blockHeight;
		stateRoots[latestStateRootBlockHeight] = _stateRoot;
	}

	/** Public functions */

	/**
	 *  @notice Public view function registrar.
	 *
	 *  @return address coreRegistrar.
	 */
	function registrar()
		public
		view
		returns (address /* registrar */)
	{
		return coreRegistrar;
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
	 *  @notice Public view function openSTRemote.
	 *
	 *  @return address coreOpenSTRemote.
	 */
	function openSTRemote()
		public
		view
		returns (address /* OpenSTRemote */)
	{
		return coreOpenSTRemote;
	}

	/**
	 * @notice Get safe unlock height
	 *
	 * @dev block height that is safe to execute confirmStakingIntent and confirmRedemptionIntent,
	 *      else there will be possibility that there is not much time left for executing processStaking
	 *      and processRedeeming respectively
	 *
	 * @return uint256 safeUnlockHeight
	 */
	function safeUnlockHeight()
		external
		view
		returns (uint256 /* safeUnlockHeight */)
	{
		return remoteChainBlocksToWait.add(latestStateRootBlockHeight);
	}

	/**
	 *  @notice Public view function getStateRoot.
	 *
	 *  @param _blockHeight Block height for which state root is needed.
	 *
	 *  @return bytes32 State root.
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
	 *  @notice Public view function getStorageRoot.
	 *
	 *  @param _blockHeight Block height for which storage root is needed.
	 *
	 *  @return bytes32 Storage root.
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
	 *  @notice External function proveOpenST.
	 *
	 *  @dev proveOpenST can be called by anyone to verify merkle proof of OpenSTRemote contract address. OpenSTRemote is OpenSTUtility
	 *		   contract address on utility chain and OpenSTValue contract address on value chain.
	 *		   Trust factor is brought by stateRoots mapping. stateRoot is committed in commitStateRoot function by mosaic process
	 *		   which is a trusted decentralized system running separately.
	 * 		   It's important to note that in replay calls of proveOpenST bytes _rlpParentNodes variable is not validated. In this case
	 *		   input storage root derived from merkle proof account nodes is verified with stored storage root of given blockHeight.
	 *		   OpenSTProven event has parameter wasAlreadyProved to differentiate between first call and replay calls.
	 *
	 *  @param _blockHeight Block height at which OpenST is to be proven.
	 *  @param _rlpEncodedAccount RLP encoded account node object.
	 *  @param _rlpParentNodes RLP encoded value of account proof parent nodes.
	 *
	 *  @return bool Status.
	 */
	function proveOpenST(
		uint256 _blockHeight,
		bytes _rlpEncodedAccount,
		bytes _rlpParentNodes)
		external
		returns(bool /* success */)
	{
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
		bytes32 hashedAccount = keccak256(abi.encodePacked(_rlpEncodedAccount));

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
}