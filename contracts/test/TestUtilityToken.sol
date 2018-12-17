pragma solidity ^0.5.0;

// Copyright 2018 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../gateway/UtilityToken.sol";

/**
 * @title TestUtilityToken contract.
 *
 * @notice This is for testing purpose.
 *
 */
contract TestUtilityToken is UtilityToken {

    /* Usings */

    using SafeMath for uint256;


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
    { }


    /* External functions */

    /**
     * @notice It sets the coGateway address. This is for testing purpose.
     *
     * @param _coGateway CoGateway address to be set.
     */
    function setCoGateway(address _coGateway) external returns (bool)
    {
        coGateway = _coGateway;
    }

}

