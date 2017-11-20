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
// contracts/STPrime.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/// Simple Token Prime [ST'] is equivalently staked for with Simple Token
/// on the value chain and is the base token that pays for gas on the utility chain.
/// The gasprice on utility chains is set in [ST'-Wei/gas] (like Ether pays for gas
/// on Ethereum mainnet) when sending a transaction on the open utility chain.

import "./SafeMath.sol";
import "./UtilityTokenAbstract.sol";
import "./STPrimeConfig.sol";

/*
 *  @title STPrime - is a freely tradable equivalent representation of Simple Token [ST]
 *         on Ethereum mainnet on the utility chain
 *  @dev STPrime functions as the base token to pay for gas consumption on the utility chain
 *       It is not an ERC20 token, but functions as the genesis guardian
 *       of the finite amount of base tokens on the utility chain
 */
contract STPrime is UtilityTokenAbstract, STPrimeConfig {
	using SafeMath for uint256;

    /*
     * Public functions
     */
    function STPrime(
    	address _openSTProtocol,
    	bytes32 _uuid)
    	UtilityTokenAbstract(_openSTProtocol, _uuid)
    	public
	{

	}

    function claim(
    	address _beneficiary)
    	public
    	returns (bool success)
    {
    	uint256 amount = claims[_beneficiary];
		require(this.balance >= amount);
        claims[_beneficiary] = 0;

        // transfer throws if insufficient funds
        _beneficiary.transfer(amount);

        return true;
    }

    /// @dev Mint new utility token into 
    function mint(
    	address _beneficiary,
    	uint256 _amount)
	    public
	    onlyProtocol
	    returns (bool success)
	{
		// can't mint more ST' than there are available base tokens
		assert(this.balance >= totalSupplyInternal() + _amount);
		
		// add the minted amount to the beneficiary's claim 
		return mintInternal(_beneficiary, _amount);
    }

    /// @dev Burn utility tokens after having redeemed them
    ///      through the protocol for the staked Simple Token
    function burn(address _redeemer, uint256 _amount)
    	public
    	onlyProtocol
    	payable
    	returns (bool success)
   	{
   		// only accept the exact amount of base tokens to be returned
   		// to the ST' minting contract
   		require(msg.value == _amount);

   		return burnInternal(_redeemer, _amount);
    }

    /*
     *  Web3 call functions
     */
    /// @dev returns total token supply
    function totalSupply() public view returns (uint256) {
        return totalSupplyInternal();
    }
}