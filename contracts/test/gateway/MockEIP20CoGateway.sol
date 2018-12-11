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

import "../../gateway/CoGatewayUtilityTokenInterface.sol";

/**
 * @title MockEIP20CoGateway contract
 *
 * @notice This contract mocks the EIP20CoGateway. This is used only for testing.
 */
contract MockEIP20CoGateway is CoGatewayUtilityTokenInterface {

    // Stores the utility token address for testing.
    address utilityTokenAddress;

    /**
     * @notice Set the utility token address for testing.
     *
     * @param _utilityToken Utility token address.
     */
    function setUtilityToken(address _utilityToken) external {
        utilityTokenAddress = _utilityToken;
    }

    /**
     * @notice Get the utility token address. This is mock function for testing.
     *
     * @return utilityToken_ Mocked utility token address
     */
    function utilityToken()
        public
        returns (address utilityToken_)
    {
        utilityToken_ = utilityTokenAddress;
    }
}
