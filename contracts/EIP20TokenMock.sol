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
// Utility chain: EIP20TokenMock.sol
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./EIP20Token.sol";



/**
 *  @title EIP20TokenMock contract.
 *
 *  @notice Implements mock totalSupply function and wraps internal 
 *          functions to enable testing EIP20Token.
 */
contract EIP20TokenMock is EIP20Token {

    /** Public functions */

    /**
     *  @notice Contract constructor.
     *
     *  @param _symbol Symbol of the token.
     *  @param _name Name of the token.
     *  @param _decimals Decimal places of the token.
     */
    constructor(string _symbol, string _name, uint8 _decimals)
            EIP20Token(_symbol, _name, _decimals)
            public { }

    /**
     *  @notice Public view function totalSupply.
     * 
     *  @dev Mock totalSupply function.
     *
     *  @return uint256 0 as mock total supply value.
     */
    function totalSupply() public view returns (uint256) {
        return 0;
    }

    /**
     *  @notice Public function claimEIP20Public.
     * 
     *  @dev Public wrapper for claimEIP20.
     *
     *  @param _beneficiary Address of tokens beneficiary.
     *  @param _amount Amount of tokens claimed for beneficiary.
     *
     *  @return bool True if claim of tokens for beneficiary address is successful, 
     *          false otherwise.
     */
    function claimEIP20Public(
        address _beneficiary,
        uint256 _amount)
        public
        returns (bool /* success */)
    {
        return claimEIP20(_beneficiary, _amount);
    }

    /**
     *  @notice Public function mintEIP20Public.
     * 
     *  @dev Public wrapper for mintEIP20.
     *
     *  @param _amount Amount of tokens to mint.
     *
     *  @return bool True if mint is successful, false otherwise.
     */
    function mintEIP20Public(
        uint256 _amount)
        public
        returns (bool /* success */)
    {
        return mintEIP20(_amount);
    }

    /**
     *  @notice Public function burnEIP20Public.
     * 
     *  @dev Public wrapper for burnEIP20.
     *
     *  @param _amount Amount of tokens to burn.
     *
     *  @return bool True if burn is successful, false otherwise.
     */
    function burnEIP20Public(
        uint256 _amount)
        public
        returns (bool /* success */)
    {
        return burnEIP20(_amount);
    }
}
