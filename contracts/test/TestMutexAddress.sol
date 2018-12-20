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

import "../lib/MutexAddress.sol";

/** @title TestMutexAddress contract to test Mutex. */
contract TestMutexAddress is MutexAddress {

    constructor()
        MutexAddress()
        public
    { }

    /**
     * @notice This acquires lock for an account if not already acquired.
     *          This will revert the transaction if lock is already acquired.
     *
     * @param _account Account for which lock acquisition is required.
     *
     * @return isAcquired_ `true` on successful lock acquisition, `false` otherwise.
     */
    function acquireExternal(address _account)
        external
        returns(bool success_)
    {
        success_ = super.acquire(_account);
    }

    /**
     * @notice This releases lock for an account if lock is acquired.
     *          This will revert the transaction if lock is not acquired.
     *
     * @param _account Account for which release lock is required.
     *
     * @return isReleased_ `true` on successful lock release, `false` otherwise.
     */
    function releaseExternal(address _account)
        external
        returns(bool success_)
    {
        success_ = super.release(_account);
    }
}
