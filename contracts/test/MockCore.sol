pragma solidity ^0.4.23;

import "../gateway/WorkersInterface.sol";
import "../gateway/Core.sol";

/**
 * @title CoreMock contract
 *
 * @notice Used for test only
 */
contract MockCore is Core {


	/*  Public functions */

	/**
	  * @notice Contract constructor
	  *
	  * @param _chainIdOrigin chain id where current core contract is deployed since core contract can be deployed on remote chain also
	  * @param _chainIdRemote if current chain is value then _chainIdRemote is chain id of utility chain
	  * @param _blockHeight block height at which _stateRoot needs to store
	  * @param _stateRoot state root hash of given _blockHeight
	  * @param _workers Workers contract address
	  */
	constructor(
		uint256 _chainIdOrigin,
		uint256 _chainIdRemote,
		uint256 _blockHeight,
		bytes32 _stateRoot,
		WorkersInterface _workers
	)
		Core(
			_chainIdOrigin,
			_chainIdRemote,
			_blockHeight,
			_stateRoot,
			_workers
		)
		public
	{}
	
	/**
	  * @notice get storage root for a given block height
	  *
	  * @dev this is for testing only so the data is mocked here
	  *
	  * @param _blockHeight block height for which storage root is needed
	  *
	  * @return bytes32 storage root
	  */
	function getStorageRoot(
		uint256 _blockHeight
	)
		public
		view
		returns (bytes32)
	{
		return keccak256(abi.encodePacked(_blockHeight));
	}

	/**
     * @notice Get the state root for the given block height.
     *
     * @dev this is for testing only so the data is mocked here
     *
     * @param _blockHeight The block height for which the state root is fetched.
     *
     * @return bytes32 State root at the given height.
     */
	function getStateRoot(
		uint256 _blockHeight
	)
		external
		view
		returns (bytes32)
	{
		return keccak256(abi.encodePacked(_blockHeight));
	}
}
