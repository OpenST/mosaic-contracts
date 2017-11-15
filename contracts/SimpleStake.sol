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
// SimpleStake - holds the value for a utility token on the OpenST platform
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./EIP20Interface.sol";
import "./SafeMath.sol";

/// @title SimpleStake - holds the value of an EIP20 token
///        for a utility token on the OpenST platform
/// @author OpenST Ltd.
contract SimpleStake {
	using SafeMath for uint256;

	/*
	 *  Events
	 */
	event ReleasedStake(address indexed _protocol, address indexed _to, uint256 _amount);
	event ProtocolTransferInitiated(address indexed _existingProtocol, address indexed _proposedProtocol, uint256 _activationHeight);
	event ProtocolTransferRevoked(address indexed _existingProtocol, address indexed _revokedProtocol);
	event ProtocolTransferCompleted(address indexed _newProtocol);

	/*
	 *  Constants
	 */
	/// Blocks to wait before the protocol transfer can be completed
	/// This allows anyone with a stake to unstake under the existing
	/// protocol if they disagree with the new proposed protocol
	/// @dev from OpenST ^v1.0 this constant will be set 
	uint256 constant public PROTOCOL_TRANSFER_BLOCKS_TO_WAIT = 1;
	
	/*
	 *  Storage
	 */
	/// EIP20 token contract that can be staked
	EIP20Interface public eip20Token;
	/// UUID for the utility token
	bytes32 public uuid;

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

	modifier notNull(address _address) {
		if (_address == 0)
			revert();
		_;
	}

	/*
	 *  Public functions
	 */
	/// @dev Contract constructor sets initial owner and EIP20 token that  
	/// @param _eip20Token EIP20 token contract that will be staked
	/// @param _openSTProtocol OpenSTProtocol contract that governs staking
	/// @param _uuid Unique Universal Identifier of the registered utility token
	function SimpleStake(
		EIP20Interface _eip20Token,
		address _openSTProtocol,
		bytes32 _uuid)
		public
	{
		eip20Token = _eip20Token;
		openSTProtocol = _openSTProtocol;
		uuid = _uuid;
	}

	/// @dev Allows the protocol to release the staked amount
	///      into provided address
	/// @param _to Beneficiary of the amount of the stake
	/// @param _amount Amount of stake to release to beneficiary
	function releaseTo(address _to, uint256 _amount) 
		public 
		onlyProtocol
		returns (bool)
	{
		require(eip20Token.transfer(_to, _amount));
		
		ReleasedStake(msg.sender, _to, _amount);

		return true;
	}

	function initiateProtocolTransfer(
		address _proposedProtocol)
		public 
		onlyProtocol 
		returns (bool)
	{
		earliestTransferHeight = block.number + PROTOCOL_TRANSFER_BLOCKS_TO_WAIT;
        proposedProtocol = _proposedProtocol;

        ProtocolTransferInitiated(openSTProtocol, _proposedProtocol, earliestTransferHeight);

        return true;
    }


    function completeProtocolTransfer() public returns (bool) {
        require(msg.sender == proposedProtocol);

        openSTProtocol = proposedProtocol;
        proposedProtocol = address(0);

        ProtocolTransferCompleted(openSTProtocol);

        return true;
    }

	/*
     * Web3 call functions
     */
    /// @dev 
    function getTotalStake()
    	public
    	constant
    	returns (uint256)
    {
    	return eip20Token.balanceOf(this);
    }
}