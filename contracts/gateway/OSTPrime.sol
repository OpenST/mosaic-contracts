/* solhint-disable-next-line compiler-fixed */
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
// Utility chain: OSTPrime
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

/// Simple Token Prime [ST'] is equivalently staked for with Simple Token
/// on the value chain and is the base token that pays for gas on the utility chain.
/// The gasprice on utility chains is set in [ST'-Wei/gas] (like Ether pays for gas
/// on Ethereum mainnet) when sending a transaction on the open utility chain.

import "./SafeMath.sol";

/** utility chain contracts */
import "./UtilityTokenAbstract.sol";
import "./OSTPrimeConfig.sol";


/**
 *  @title OSTPrime contract which implements UtilityTokenAbstract and OSTPrimeConfig.
 *
 *  @notice A freely tradable equivalent representation of Simple Token [ST]
 *          on Ethereum mainnet on the utility chain.
 *
 *  @dev OSTPrime functions as the base token to pay for gas consumption on the utility chain
 *       It is not an EIP20 token, but functions as the genesis guardian
 *       of the finite amount of base tokens on the utility chain.
 */
contract OSTPrime is UtilityTokenAbstract, OSTPrimeConfig {
    using SafeMath for uint256;

    /** Storage */

    address public token;

    /** set when ST' has received TOKENS_MAX tokens; when uninitialised minting is not allowed */
    bool private initialized;

    /**  Modifiers */

    /**
     *  @notice Modifier onlyInitialized.
     *
     *  @dev Checks if initialized is set to True to proceed.
     */    
    modifier onlyInitialized() {
        require(initialized);
        _;
    }

    /** Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @dev Sets the UtilityTokenAbstract contract. 
     *
     *  @param _token ERC20 token address
     *  @param _conversionRate Conversion rate of the token.
     *  @param _conversionRateDecimals Decimal places of conversion rate of token.
     */    
    constructor(
        address _token,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals)
        public
        UtilityTokenAbstract(
        _conversionRate,
        _conversionRateDecimals)
        {
            require(_token != address(0),
            "ERC20 token address cannot be 0");

            token = _token;
        }

    /**
     *  @notice Public function initialize. 
     *
     *  @dev Before the registrar registers a core on the value chain
     *       it must verify that the genesis exactly specified TOKENS_MAX
     *       so that all base tokens are held by OSTPrime.
     *       On setup of the utility chain the base tokens need to be transfered 
     *       in full to OSTPrime for the base tokens to be minted as ST'
     */    
    function initialize()
        public
        payable
    {
        require(msg.value == TOKENS_MAX);
        initialized = true;
    }

    /**
     *  @notice Public function mint.
     *
     *  @dev Only callable by Protocol, Inititalized. Mint new Simple Token Prime into circulation and increase 
     *       total supply accordingly. Tokens are minted into a claim to ensure that the protocol completion does 
     *       not continue into foreign contracts at _beneficiary.
     *  
     *  @param _beneficiary Address of the beneficiary.
     *  @param _amount Amount of tokens to mint.
     *
     *  @return bool True if mint is successful for beneficiary, false otherwise.
     */
    function mint(
        address _beneficiary,
        uint256 _amount)
        public
        onlyProtocol
        onlyInitialized
        returns (bool /** success */)
    {
        // add the minted amount to the beneficiary's claim 
        require(mintInternal(_beneficiary, _amount));

        assert(address(this).balance >= _amount);

        // transfer throws if insufficient funds
        _beneficiary.transfer(_amount);

        return true;
    }

    /**
     *  @notice Public function burn.
     *
     *  @dev Only callable by Protocol, Inititalized. Substracts _amount tokens from the balance of 
     *       function caller's address. Burn utility tokens after having redeemed them through 
     *       the protocol for the staked Simple Token.
     *
     *  @param _burner Address of token burner.
     *  @param _amount Amount of tokens to burn.
     *
     *  @return bool True if burn is successful, false otherwise.
     */    
    function burn(
        address _burner,
        uint256 _amount)
        public
        onlyProtocol
        onlyInitialized
        payable
        returns (bool /** success */)
    {
        // only accept the exact amount of base tokens to be returned
        // to the ST' minting contract
        require(msg.value == _amount);

        return burnInternal(_burner, _amount);
    }
}