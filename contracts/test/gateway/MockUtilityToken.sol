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
 * @title MockUtilityToken contract.
 *
 * @notice This contract is used to mock certain functions of UtilityToken
 *         contract.
 */
contract MockUtilityToken is UtilityToken {

    // Total initial balance of the deployer.
    uint256 constant INITIAL_BALANCE  = 1000000000000000000;


    /* Constructor */

    /**
     * @notice Constructor.
     *
     * @dev This is used for testing only.
     *
     * @param _token Address of branded token.
     * @param _symbol Symbol of token.
     * @param _name Name of token.
     * @param _decimals Decimal of token.
     * @param _organization Address of a contract that manages organization.
     */
    constructor(
        EIP20Interface _token,
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        OrganizationInterface _organization
    )
        public
        UtilityToken(_token, _symbol, _name, _decimals, _organization)
    {
        balances[msg.sender] = INITIAL_BALANCE;
        totalTokenSupply = totalTokenSupply.add(INITIAL_BALANCE);

    }

    /**
     * @notice Set the CoGateway address for testing.
     *
     * @param _coGatewayAddress CoGateway address.
     */
    function setCoGatewayAddress(address _coGatewayAddress) external {
        coGateway = _coGatewayAddress;
    }
}
