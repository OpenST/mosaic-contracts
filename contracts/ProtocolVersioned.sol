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
// Common: ProtocolVersioned.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/**
 *  @title ProtocolVersioned contract.
 *
 *  @notice Contains functions that facilitate a protocol version 
 *          transfer by exisiting protocol.
 */
contract ProtocolVersioned {

	/** Events */

	event ProtocolTransferInitiated(address indexed _existingProtocol, address indexed _proposedProtocol, uint256 _activationHeight);
	event ProtocolTransferRevoked(address indexed _existingProtocol, address indexed _revokedProtocol);
	event ProtocolTransferCompleted(address indexed _newProtocol);

	/** Constants */

	/**
	 *  Blocks to wait before the protocol transfer can be completed
	 *  This allows anyone with a stake to unstake under the existing
	 *  protocol if they disagree with the new proposed protocol
	 * 
	 *  @dev from OpenST ^v1.0 this constant will be set to a significant value
	 *       ~ 1 week at 15 seconds per block
	 */
	uint256 constant private PROTOCOL_TRANSFER_BLOCKS_TO_WAIT = 40320;
	
	/** Storage */
	
	/** OpenST protocol contract */
	address public openSTProtocol;
	/** proposed OpenST protocol */
	address public proposedProtocol;
	/** earliest protocol transfer height */
	uint256 public earliestTransferHeight;

	/** Modifiers */

	/**
	 *  @notice Modifier onlyProtocol.
	 *
	 *  @dev Checks if msg.sender is openST protocol to proceed.
	 */
	modifier onlyProtocol() {
		require(msg.sender == openSTProtocol);
		_;
	}

	/**
	 *  @notice Modifier onlyProposedProtocol.
	 *
	 *  @dev Checks if msg.sender is proposed protocol to proceed.
	 */
	modifier onlyProposedProtocol() {
		require(msg.sender == proposedProtocol);
		_;
	}

	/**
	 *  @notice Modifier afterWait.
	 *
	 *  @dev Checks if earliest transfer height is lower or equal 
	 *       to current block to proceed.
	 */
	modifier afterWait() {
		require(earliestTransferHeight <= block.number);
		_;
	}

	/**
	 *  @notice Modifier notNull.
	 *
	 *  @dev Checks if address is not null to proceed.
	 */
	modifier notNull(address _address) {
		require(_address != 0);
		_;
	}
	
	// TODO: [ben] add hasCode modifier so that for 
	//       a significant wait time the code at the proposed new
	//       protocol can be reviewed

	/** Public functions */

	/**
	 *  @notice Contract constructor.
	 *
	 *  @dev Constructor sets the OpenST Protocol address.
	 *
	 *  @param _protocol Address of the openSTProtocol.
	 */
	constructor(address _protocol)
		public
		notNull(_protocol)
	{
		openSTProtocol = _protocol;
	}

	/**
	 *  @notice Public function inititateProtocolTransfer.
	 *
	 *  @dev Only callable by protocol. Initiates protocol transfer.
	 *
	 *  @param _proposedProtocol Address of the proposed openSTProtocol.
	 *
	 *  @return bool True if protocol tranfer is successfully inititated, false otherwise.
	 */
	function initiateProtocolTransfer(
		address _proposedProtocol)
		public 
		onlyProtocol
		notNull(_proposedProtocol)
		returns (bool)
	{
		require(_proposedProtocol != openSTProtocol);
		require(proposedProtocol == address(0));

		earliestTransferHeight = block.number + blocksToWaitForProtocolTransfer();
		proposedProtocol = _proposedProtocol;

		emit ProtocolTransferInitiated(openSTProtocol, _proposedProtocol, earliestTransferHeight);

		return true;
	}

	/**
	 *  @notice Public function completeProtocolTransfer.
	 *
	 *  @dev Only callable by proposed protocol. Only after the waiting period, can
	 *       proposed protocol complete the transfer.
	 *
	 *  @return bool True if protocol transfer is completed, false otherwise.
	 */
	 function completeProtocolTransfer()
	 	public
	 	onlyProposedProtocol
	 	afterWait
	 	returns (bool) 
	 {
	 	openSTProtocol = proposedProtocol;
	 	proposedProtocol = address(0);
	 	earliestTransferHeight = 0;

	 	emit ProtocolTransferCompleted(openSTProtocol);

	 	return true;
	 }


	/**
	 *  @notice Public function revokeProtocolTransfer.
	 *
	 *  @dev Only callable by proposed protocol. Protocol can revoke initiated protocol
	 *       transfer.
	 *
	 *  @return bool True if protocol transfer is revoked, false otherwise.
	 */
	 function revokeProtocolTransfer()
	 	public
	 	onlyProtocol
	 	returns (bool)
	 {
	 	require(proposedProtocol != address(0));

	 	address revokedProtocol = proposedProtocol;
	 	proposedProtocol = address(0);
	 	earliestTransferHeight = 0;

		emit ProtocolTransferRevoked(openSTProtocol, revokedProtocol);

		return true;
	}

	/**
	 *  @notice Public function blocksToWaitForProtocolTransfer.
	 *
	 *  @return uint256 Protocol transfer blocks to wait.
	 */
	 function blocksToWaitForProtocolTransfer() public pure returns (uint256) {
	 	return PROTOCOL_TRANSFER_BLOCKS_TO_WAIT;
	 }
}