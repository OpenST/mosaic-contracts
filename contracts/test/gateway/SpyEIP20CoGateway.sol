pragma solidity ^0.5.0;

// Copyright 2019 OpenST Ltd.
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

import "./SpyToken.sol";

/**
 * @title A test double co-gateway where you can check sent values.
 *
 * @notice Use this spy if you need to investigate which values were sent to
 *         the co-gateway.
 */
contract SpyEIP20CoGateway {

    SpyToken public utilityToken;
    uint256 public expectedNonce = 1;

    constructor() public {
        utilityToken = new SpyToken();
    }

    function getNonce(address) external view returns(uint256) {
        return expectedNonce;
    }
}
