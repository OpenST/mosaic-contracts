pragma solidity ^0.4.17;

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

contract ProtocolVersioned {

	/*
	 *  Events
	 */
	event ProtocolTransferInitiated(address indexed _existingProtocol, address indexed _proposedProtocol, uint256 _activationHeight);
	event ProtocolTransferRevoked(address indexed _existingProtocol, address indexed _revokedProtocol);
	event ProtocolTransferCompleted(address indexed _newProtocol);

	/*
	 *  Constants
	 */
	/// Blocks to wait before the protocol transfer can be completed
	/// This allows anyone with a stake to unstake under the existing
	/// protocol if they disagree with the new proposed protocol
	/// @dev from OpenST ^v1.0 this constant will be set to a significant value
	uint256 constant public PROTOCOL_TRANSFER_BLOCKS_TO_WAIT = 5;
	
	/*
	 *  Storage
	 */
	/// OpenST protocol contract
	address public openSTProtocol;
	/// proposed OpenST protocol
	address public proposedProtocol;
	/// earliest protocol transfer height
	uint256 public earliestTransferHeight;

	/*
	 * Modifiers
	 */
	modifier onlyProtocol() {
		require(msg.sender == openSTProtocol);
		_;
	}

	modifier onlyProposedProtocol() {
        require(msg.sender == proposedProtocol);
        _;
	}

	modifier afterWait() {
		require(earliestTransferHeight <= block.number);
		_;
	}

	modifier notNull(address _address) {
		require(_address != 0);
		_;
	}
	
	// TODO: [ben] add hasCode modifier so that for 
	//       a significant wait time the code at the proposed new
	//       protocol can be reviewed

	/*
	 *  Public functions
	 */
	/// @dev Constructor set the OpenST Protocol
	function ProtocolVersioned(address _protocol) 
		public
		notNull(_protocol)
	{
		openSTProtocol = _protocol;
	}

	/// @dev initiate protocol transfer
	function initiateProtocolTransfer(
		address _proposedProtocol)
		public 
		onlyProtocol
		notNull(_proposedProtocol)
		returns (bool)
	{
		require(_proposedProtocol != openSTProtocol);
		require(proposedProtocol == address(0));

		earliestTransferHeight = block.number + PROTOCOL_TRANSFER_BLOCKS_TO_WAIT;
        proposedProtocol = _proposedProtocol;

        ProtocolTransferInitiated(openSTProtocol, _proposedProtocol, earliestTransferHeight);

        return true;
    }

    /// @dev only after the waiting period, can
    ///      proposed protocol complete the transfer
    function completeProtocolTransfer()
    	public
    	onlyProposedProtocol
    	afterWait
    	returns (bool) 
    {
        openSTProtocol = proposedProtocol;
        proposedProtocol = address(0);
    	earliestTransferHeight = 0;

        ProtocolTransferCompleted(openSTProtocol);

        return true;
    }

    /// @dev protocol can revoke initiated protocol
    ///      transfer
    function revokeProtocolTransfer()
    	public
    	onlyProtocol
    	returns (bool)
    {
    	require(proposedProtocol != address(0));

    	address revokedProtocol = proposedProtocol;
    	proposedProtocol = address(0);
    	earliestTransferHeight = 0;

		ProtocolTransferRevoked(openSTProtocol, revokedProtocol);

    	return true;
    }

}