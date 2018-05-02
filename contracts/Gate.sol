pragma solidity ^0.4.23;

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
// Value chain: Gate
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

import "./ProtocolVersioned.sol";

contract Gate is ProtocolVersioned {
    /*
     *  Structures
     */
    struct StakeRequest {
        uint256 amount;
        uint256 unlockHeight;
        address beneficiary; //The token holder contract in the future 
        bytes32 hashLock;
    }

    /*
     *  Storage
     */
    address public workers; //TODO: update type once workers contract and interfaces are added to the repo.
    mapping(address /*staker */ => StakeRequest) public stakeRequests;

    function Gate() public { //TODO: complete as necessary

    }
}