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
// Auxiliary Chain: MockMerklePatriciaProof
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "../../gateway/CoGatewayUtilityTokenInterface.sol";

contract MockEIP20CoGateway is CoGatewayUtilityTokenInterface {

    address utilityTokenAddress;

    function setUtilityToken(address _utilityToken)
        external
    {
        utilityTokenAddress = _utilityToken;
    }
    /**
     * @notice This is mock function for testing.
     *
     * @return address of utility token.
     */
    function utilityToken()
        public
        returns (address utilityToken_)
    {
        utilityToken_ = utilityTokenAddress;
    }
}
