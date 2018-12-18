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

import "../../gateway/UtilityToken.sol";

/**
 * @title TestUtilityToken contract
 *
 * @notice This contract is used to mock certain functions of UtilityToken
 *         contract.
 */
contract MockUtilityToken is UtilityToken {

    /* Constructor */

    /**
     * @dev This is used for testing by mocking certain variables.
     *
     * @param _token Address of branded token.
     * @param _symbol Symbol of token.
     * @param _name Name of token.
     * @param _decimals Decimal of token.
     */
    constructor(
        EIP20Interface _token,
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        IsMemberInterface _membersManager
    )
    public
    UtilityToken(_token, _symbol, _name, _decimals, _membersManager)
    {}

    /**
     * @notice Set the CoGateway address for testing.
     *
     * @param _coGatewayAddress CoGateway address.
     */
    function setCoGatewayAddress(address _coGatewayAddress) public {
        coGateway = _coGatewayAddress;
    }

}
