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
// Utility chain: UtilityTokenAbstractMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./UtilityTokenAbstract.sol";


/**
 *  @title UtilityTokenAbstractMock contract.
 *
 *  @dev Implements mock claim, mint, and burn functions
 *       and wraps internal functions to enable testing UtilityTokenAbstract
 */
contract UtilityTokenAbstractMock is UtilityTokenAbstract {

    /**
     *  @notice Contract constructor.
     *
     *  @param _uuid UUID of the token.
     *  @param _symbol Symbol of the token. 
     *  @param _name Name of the token.
     *  @param _chainIdValue Chain id of the value chain.
     *  @param _chainIdUtility Chain id of the utility chain.
     *  @param _conversionRate Conversion rate of the token.
     *  @param _conversionRateDecimals Decimal places of conversion rate of token.
     */
    constructor(
        bytes32 _uuid,
        string _symbol,
        string _name,
        uint256 _chainIdValue,
        uint256 _chainIdUtility,
        uint256 _conversionRate,
        uint8 _conversionRateDecimals)
        public
        UtilityTokenAbstract(
        _uuid,
        _symbol,
        _name,
        _chainIdValue,
        _chainIdUtility,
        _conversionRate,
        _conversionRateDecimals)
        { }

    /**
     *  @notice Public function claim.
     *
     *  @dev Mock claim function. 
     *
     *  @param _beneficiary Address of the utility tokens beneficiary.
     *
     *  @return True if claim of utility tokens for beneficiary address is successful, 
     *          false otherwise.
     */
    function claim(address _beneficiary) public returns (bool success) {
        _beneficiary;
        success = true;
    }

    /**
     *  @notice Public function mintEIP20.
     *
     *  @dev Mock mint function. 
     *
     *  @param _beneficiary Address of beneficiary.
     *  @param _amount Amount of utility tokens to mint.
     *
     *  @return True if mint is successful, false otherwise.
     */
    function mint(address _beneficiary, uint256 _amount) public returns (bool success) {
        _beneficiary;
        _amount;
        success = true;
    }

    /**
     *  @notice Public function burn.
     *
     *  @dev Mock burn function. 
     *
     *  @param _redeemer Address of token burner. 
     *  @param _amount Amount of tokens to burn.
     *
     *  @return True if burn is successful, false otherwise.
     */
    function burn(address _redeemer, uint256 _amount) public payable returns (bool success) {
        _redeemer;
        _amount;
        success = true;
    }
       


    /**
     *  @notice Internal function claimInternalPublic.
     *
     *  @dev Public wrapper for claimInternalPublic.
     *       Claim transfers all utility tokens to _beneficiary.
     *
     *  @param _beneficiary Address of the beneficiary.
     *
     *  @return uint256 Amount of tokens to be claimed by beneficiary.
     */   
    function claimInternalPublic(
        address _beneficiary)
        public
        returns (uint256 amount)
    {
        amount = claimInternal(_beneficiary);
    }


    /**
     *  @notice Public function mintInternalPublic.
     *
     *  @dev Public wrapper for mintInternalPublic.
     *       Mint new utility token by adding a claim
     *       for the beneficiary.
     *
     *  @param _beneficiary Address of the beneficiary.
     *  @param _amount Amount of tokens to mint. 
     *
     *  @return bool True if tokens are minted, false otherwise.
     */    
    function mintInternalPublic(
        address _beneficiary,
        uint256 _amount)
        public
        returns (bool /* success */)
    {
        return mintInternal(_beneficiary, _amount);        
    }

    /**
     *  @notice Public function burnInternalPublic.
     *
     *  @dev Public wrapper for burnInternalPublic.
     *       Burn utility tokens after having redeemed them
     *       through the protocol for the staked Simple token.
     *
     *  @param _redeemer Address of the redeemer of tokens.
     *  @param _amount Amount of tokens to burn.
     *
     *  @return bool True if tokens are burnt, false otherwise.
     */
    function burnInternalPublic(
        address _redeemer,
        uint256 _amount)
        public
        returns (bool /* success */)
    {
        return burnInternal(_redeemer, _amount);
    }
}