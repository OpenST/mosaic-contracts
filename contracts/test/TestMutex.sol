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

import "../lib/Mutex.sol";

/** @title TestMutex contract to test Mutex */
contract TestMutex is Mutex{

    constructor() public
    { }

    /** @notice This acquires lock for an address if not already acquired.
     *          This will revert the transaction if lock is already acquired.
     *
     * @param _address Address for which lock acquisition is required.
     *
     * @return success_ `true` on successful lock acquisition, `false` otherwise.
     */
    function acquireExternal(address _address)
        external
        returns(bool success_)
    {
        success_ = super.acquire(_address);
    }

    /** @notice This releases lock for an address if lock is acquired.
     *          This will revert the transaction if lock is not acquired.
     *
     * @param _address Address for which release lock is required.
     *
     * @return success_ `true` on successful lock release, `false` otherwise.
     */
    function releaseExternal(address _address)
        external
        returns(bool success_)
    {
        success_ = super.release(_address);
    }
}
