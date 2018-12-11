pragma solidity ^0.5.0;

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
// Auxiliary chain: MockUtilityToken
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


import "../gateway/UtilityToken.sol";

/**
 *  @title MockUtilityToken contract.
 *
 *  @notice This is for testing purpose.
 *
 */
contract MockUtilityToken is UtilityToken {

    /* Usings */

    using SafeMath for uint256;


    /* Storage */

    /**
     * Address to which the utility tokens will be transferred after minting.
     */
    address public beneficiary;

    /* Amount received by beneficiary.  */
    uint256 public amount;


    /* Constructor */

    /**
     * @notice Contract constructor.
     *
     * @dev This is for testing purpose.
     *
     * @param _symbol Symbol of token.
     * @param _name Name of token.
     * @param _decimals Decimal of token.
     * @param _valueToken Address of value branded token.
     */
    constructor(
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        address _valueToken
    )
        public
        UtilityToken(_symbol, _name, _decimals, _valueToken)
    {
        require(
            _valueToken != address(0),
            "ERC20 token should not be zero"
        );

        valueToken = _valueToken;
    }


    /* External functions */

    /**
     * @notice Mints the utility token. This is for testing purpose.
     *
     * @dev Adds _amount tokens to beneficiary balance and increases the
     *      totalTokenSupply. Can be called only by CoGateway.
     *
     * @param _beneficiary Address of tokens beneficiary.
     * @param _amount Amount of tokens to mint.
     *
     * @return True if mint is successful, false otherwise.
     */
    function mint(
        address _beneficiary,
        uint256 _amount
    )
        external
        returns (bool)
    {
        beneficiary = _beneficiary;
        amount = _amount;
        return true;
    }

}

