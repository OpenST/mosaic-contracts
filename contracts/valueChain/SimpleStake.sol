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
// contracts/SimpleStake
// 
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../EIP20Interface.sol";
import "../SafeMath.sol";
import "../ProtocolVersioned.sol";

/// @title SimpleStake - stakes the value of an EIP20 token on Ethereum
///        for a utility token on the OpenST platform
/// @author OpenST Ltd.
contract SimpleStake is ProtocolVersioned {
	using SafeMath for uint256;

	/*
	 *  Events
	 */
	event ReleasedStake(address indexed _protocol, address indexed _to, uint256 _amount);

	/*
	 *  Storage
	 */
	/// EIP20 token contract that can be staked
	EIP20Interface public eip20Token;
	/// UUID for the utility token
	bytes32 public uuid;

	/*
	 *  Public functions
	 */
	/// @dev Contract constructor sets the protocol and the EIP20 token to stake
	/// @param _eip20Token EIP20 token that will be staked
	/// @param _openSTProtocol OpenSTProtocol contract that governs staking
	/// @param _uuid Unique Universal Identifier of the registered utility token
	function SimpleStake(
		EIP20Interface _eip20Token,
		address _openSTProtocol,
		bytes32 _uuid)
		ProtocolVersioned(_openSTProtocol)
		public
	{
		eip20Token = _eip20Token;
		uuid = _uuid;
	}

	/// @dev Allows the protocol to release the staked amount
	///      into provided address.
	///      The protocol MUST be a contract that sets the rules
	///      on how the stake can be released and to who.
	///      The protocol takes the role of an "owner" of the stake.
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

	/*
     * Web3 call functions
     */
    /// @dev total stake is the balance of the staking contract
    ///      accidental transfers directly to SimpleStake bypassing
    ///      the OpenST protocol will not mint new utility tokens,
    ///      but will add to the total stake.
    ///      (accidental) donations can not be prevented
    function getTotalStake()
    	public
    	constant
    	returns (uint256)
    {
    	return eip20Token.balanceOf(this);
    }
}