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

/**
 * @title MockRedeemerProxy is a contract used for unit testing of RedeemPool
 *        method `destructStakerProxy`.
 */
contract MockRedeemerProxy {

    /* Storage */

    /** Flag to assert if self destruct is called. */
    bool public selfDestruted;


    /* Special Functions */

    constructor () public {
        selfDestruted = false;
    }

    /**
     * @notice Mock method called from redeem pool during unit testing of
     *         `destructRedeemerProxy`.
     */
    function selfDestruct() external {
        selfDestruted = true;
    }
}
